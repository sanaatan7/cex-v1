import {
  OrderStatus,
  OrderTypes,
  Sides,
} from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import type { CreateOrderInput } from "../schemas/order.schema";
import { balanceService } from "./balance.service";
import {
  orderbookService,
  type BookOrder,
  type PriceLevel,
} from "./orderbook.service";
import { stockService } from "./stock.service";

type MatchResult = {
  filledQty: number;
  totalPrice: number;
};

const remainingQty = (order: BookOrder) => order.qty - order.filledQty;

const resolveStatus = (filledQty: number, qty: number): OrderStatus => {
  if (filledQty === 0) {
    return OrderStatus.NOT_FILLED;
  }
  if (filledQty < qty) {
    return OrderStatus.P_FILLED;
  }
  return OrderStatus.FILLED;
};

const toPrismaSide = (side: CreateOrderInput["side"]): Sides =>
  side === "buy" ? Sides.BUYER : Sides.SELLER;

const toPrismaType = (type: CreateOrderInput["type"]): OrderTypes =>
  type === "limit" ? OrderTypes.LIMIT : OrderTypes.MARKET;

export const orderService = {
  async create(userId: number, input: CreateOrderInput) {
    const stock = await stockService.findByMarketId(input.market_id);
    const symbol = stock.title;
    const side = toPrismaSide(input.side);
    const type = toPrismaType(input.type);

    if (side === Sides.BUYER) {
      const lockAmount =
        type === OrderTypes.LIMIT && input.price !== null
          ? input.price * input.qty
          : this.estimateMarketBuyLock(symbol, input.qty);
      balanceService.lockUsd(userId, lockAmount);
    } else {
      balanceService.lockStock(userId, symbol, input.qty);
    }

    const order = await prisma.orders.create({
      data: {
        side,
        type,
        price: input.price,
        qty: input.qty,
        filledQty: 0,
        status: OrderStatus.NOT_FILLED,
        stocksId: stock.id,
        userId,
      },
    });

    const bookOrder: BookOrder = {
      orderId: order.id,
      userId,
      qty: input.qty,
      filledQty: 0,
      price: input.price,
      type,
      createdAt: order.createdAt,
    };

    let matchResult: MatchResult;

    try {
      if (side === Sides.BUYER) {
        matchResult = await this.matchBuyOrder(symbol, bookOrder, input);
      } else {
        matchResult = await this.matchSellOrder(symbol, bookOrder, input);
      }
    } catch (error) {
      await this.rollbackOrder(order.id, userId, symbol, input);
      throw error;
    }

    const status = resolveStatus(matchResult.filledQty, input.qty);

    const updatedOrder = await prisma.orders.update({
      where: { id: order.id },
      data: {
        filledQty: matchResult.filledQty,
        status,
      },
    });

    const remaining = input.qty - matchResult.filledQty;

    if (remaining > 0 && type === OrderTypes.LIMIT && input.price !== null) {
      if (side === Sides.BUYER) {
        orderbookService.addBid(symbol, input.price, {
          ...bookOrder,
          filledQty: matchResult.filledQty,
        });
      } else {
        orderbookService.addAsk(symbol, input.price, {
          ...bookOrder,
          filledQty: matchResult.filledQty,
        });
      }
    } else if (remaining > 0 && type === OrderTypes.MARKET) {
      if (side === Sides.BUYER) {
        const locked = this.estimateMarketBuyLock(symbol, input.qty);
        const spent = matchResult.totalPrice;
        balanceService.unlockUsd(userId, locked - spent);
      } else {
        balanceService.unlockStock(userId, symbol, remaining);
      }
    }

    return {
      orderId: String(updatedOrder.id),
      filledQty: matchResult.filledQty,
      totalPrice: matchResult.totalPrice,
      status: updatedOrder.status,
    };
  },

  estimateMarketBuyLock(symbol: string, qty: number): number {
    let remaining = qty;
    let total = 0;

    for (const [askPrice, level] of orderbookService.getBestAsks(symbol)) {
      const available = level.totalQty;
      const fillQty = Math.min(remaining, available);
      total += fillQty * askPrice;
      remaining -= fillQty;
      if (remaining === 0) {
        break;
      }
    }

    if (remaining > 0) {
      throw new AppError(400, "Insufficient liquidity for market buy");
    }

    return total;
  },

  async rollbackOrder(
    orderId: number,
    userId: number,
    symbol: string,
    input: CreateOrderInput,
  ) {
    await prisma.orders.delete({ where: { id: orderId } }).catch(() => undefined);

    if (input.side === "buy") {
      const lockAmount =
        input.type === "limit" && input.price !== null
          ? input.price * input.qty
          : this.estimateMarketBuyLock(symbol, input.qty);
      balanceService.unlockUsd(userId, lockAmount);
    } else {
      balanceService.unlockStock(userId, symbol, input.qty);
    }
  },

  async matchBuyOrder(
    symbol: string,
    taker: BookOrder,
    input: CreateOrderInput,
  ): Promise<MatchResult> {
    let filledQty = 0;
    let totalPrice = 0;
    const asks = orderbookService.getBestAsks(symbol);

    for (const [askPrice, level] of asks) {
      if (remainingQty(taker) === 0) {
        break;
      }

      if (
        input.type === "limit" &&
        input.price !== null &&
        askPrice > input.price
      ) {
        break;
      }

      const result = await this.fillAgainstLevel(
        symbol,
        taker,
        askPrice,
        level,
        "ASKS",
        Sides.BUYER,
      );
      filledQty += result.filledQty;
      totalPrice += result.totalPrice;
      taker.filledQty += result.filledQty;
    }

    return { filledQty, totalPrice };
  },

  async matchSellOrder(
    symbol: string,
    taker: BookOrder,
    input: CreateOrderInput,
  ): Promise<MatchResult> {
    let filledQty = 0;
    let totalPrice = 0;
    const bids = orderbookService.getBestBids(symbol);

    for (const [bidPrice, level] of bids) {
      if (remainingQty(taker) === 0) {
        break;
      }

      if (
        input.type === "limit" &&
        input.price !== null &&
        bidPrice < input.price
      ) {
        break;
      }

      const result = await this.fillAgainstLevel(
        symbol,
        taker,
        bidPrice,
        level,
        "BIDS",
        Sides.SELLER,
      );
      filledQty += result.filledQty;
      totalPrice += result.totalPrice;
      taker.filledQty += result.filledQty;
    }

    return { filledQty, totalPrice };
  },

  async fillAgainstLevel(
    symbol: string,
    taker: BookOrder,
    price: number,
    level: PriceLevel,
    bookSide: "BIDS" | "ASKS",
    takerSide: Sides,
  ): Promise<MatchResult> {
    let filledQty = 0;
    let totalPrice = 0;

    for (const maker of [...level.orders]) {
      const qtyToFill = Math.min(remainingQty(taker), remainingQty(maker));
      if (qtyToFill <= 0) {
        continue;
      }

      await this.settleTrade({
        symbol,
        price,
        qty: qtyToFill,
        buyerId: takerSide === Sides.BUYER ? taker.userId : maker.userId,
        sellerId: takerSide === Sides.SELLER ? taker.userId : maker.userId,
        takerOrderId: taker.orderId,
        makerOrderId: maker.orderId,
        takerSide,
        takerType: taker.type,
        makerType: maker.type,
      });

      maker.filledQty += qtyToFill;
      filledQty += qtyToFill;
      totalPrice += price * qtyToFill;

      level.totalQty -= qtyToFill;

      const makerRemaining = remainingQty(maker);
      if (makerRemaining === 0) {
        level.orders = level.orders.filter(
          (order) => order.orderId !== maker.orderId,
        );
        await prisma.orders.update({
          where: { id: maker.orderId },
          data: { filledQty: maker.filledQty, status: OrderStatus.FILLED },
        });
      } else {
        await prisma.orders.update({
          where: { id: maker.orderId },
          data: {
            filledQty: maker.filledQty,
            status: OrderStatus.P_FILLED,
          },
        });
      }
    }

    const book = orderbookService.get(symbol);
    if (level.orders.length === 0) {
      book[bookSide].delete(price);
    } else {
      book[bookSide].set(price, level);
    }

    return { filledQty, totalPrice };
  },

  async settleTrade(params: {
    symbol: string;
    price: number;
    qty: number;
    buyerId: number;
    sellerId: number;
    takerOrderId: number;
    makerOrderId: number;
    takerSide: Sides;
    takerType: OrderTypes;
    makerType: OrderTypes;
  }) {
    const tradeValue = params.price * params.qty;

    balanceService.spendLockedUsd(params.buyerId, tradeValue);

    const buyerOrder = await prisma.orders.findUnique({
      where: {
        id:
          params.takerSide === Sides.BUYER
            ? params.takerOrderId
            : params.makerOrderId,
      },
    });

    if (
      buyerOrder?.type === OrderTypes.LIMIT &&
      buyerOrder.price !== null &&
      buyerOrder.price > params.price
    ) {
      balanceService.unlockUsd(
        params.buyerId,
        (buyerOrder.price - params.price) * params.qty,
      );
    }

    balanceService.creditUsd(params.sellerId, tradeValue);
    balanceService.spendLockedStock(params.sellerId, params.symbol, params.qty);
    balanceService.creditStock(params.buyerId, params.symbol, params.qty);

    await prisma.fills.createMany({
      data: [
        {
          qty: params.qty,
          side: Sides.BUYER,
          type: params.takerSide === Sides.BUYER ? params.takerType : params.makerType,
          userId: params.buyerId,
          price: params.price,
          asset: params.symbol,
          originalOrderId:
            params.takerSide === Sides.BUYER
              ? params.takerOrderId
              : params.makerOrderId,
        },
        {
          qty: params.qty,
          side: Sides.SELLER,
          type: params.takerSide === Sides.SELLER ? params.takerType : params.makerType,
          userId: params.sellerId,
          price: params.price,
          asset: params.symbol,
          originalOrderId:
            params.takerSide === Sides.SELLER
              ? params.takerOrderId
              : params.makerOrderId,
        },
      ],
    });
  },

  async getById(userId: number, orderId: number) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { stocks: true },
    });

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    if (order.userId !== userId) {
      throw new AppError(403, "Forbidden");
    }

    return order;
  },

  async listByUser(userId: number) {
    return prisma.orders.findMany({
      where: { userId },
      include: { stocks: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async listFillsByUser(userId: number) {
    return prisma.fills.findMany({
      where: { userId },
      include: { stock: true, order: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async cancel(userId: number, orderId: number) {
    const order = await this.getById(userId, orderId);

    if (order.status === OrderStatus.FILLED) {
      throw new AppError(400, "Filled orders cannot be cancelled");
    }

    const symbol = order.stocks.title;
    const remaining = order.qty - order.filledQty;

    if (remaining <= 0) {
      throw new AppError(400, "Order has no remaining quantity");
    }

    if (order.type !== OrderTypes.LIMIT || order.price === null) {
      throw new AppError(400, "Only open limit orders can be cancelled");
    }

    const bookSide = order.side === Sides.BUYER ? "BIDS" : "ASKS";
    const removed = orderbookService.removeOrder(
      symbol,
      bookSide,
      order.price,
      order.id,
    );

    if (!removed) {
      throw new AppError(404, "Order is not active in the order book");
    }

    if (order.side === Sides.BUYER) {
      balanceService.unlockUsd(userId, order.price * remaining);
    } else {
      balanceService.unlockStock(userId, symbol, remaining);
    }

    const status =
      order.filledQty > 0 ? OrderStatus.P_FILLED : OrderStatus.NOT_FILLED;

    return prisma.orders.update({
      where: { id: order.id },
      data: { status },
    });
  },
};
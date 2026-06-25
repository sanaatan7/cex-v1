import type { OrderTypes } from "../../generated/prisma/enums";

export type BookOrder = {
  orderId: number;
  userId: number;
  qty: number;
  filledQty: number;
  price: number | null;
  type: OrderTypes;
  createdAt: Date;
};

export type PriceLevel = {
  totalQty: number;
  orders: BookOrder[];
};

export type SymbolOrderbook = {
  BIDS: Map<number, PriceLevel>;
  ASKS: Map<number, PriceLevel>;
};

const orderbooks = new Map<string, SymbolOrderbook>();

const createOrderbook = (): SymbolOrderbook => ({
  BIDS: new Map(),
  ASKS: new Map(),
});

export const orderbookService = {
  get(symbol: string): SymbolOrderbook {
    const existing = orderbooks.get(symbol);
    if (existing) {
      return existing;
    }
    const book = createOrderbook();
    orderbooks.set(symbol, book);
    return book;
  },

  addBid(symbol: string, price: number, order: BookOrder): void {
    const book = this.get(symbol);
    const level = book.BIDS.get(price) ?? { totalQty: 0, orders: [] };
    level.orders.push(order);
    level.totalQty += order.qty - order.filledQty;
    book.BIDS.set(price, level);
  },

  addAsk(symbol: string, price: number, order: BookOrder): void {
    const book = this.get(symbol);
    const level = book.ASKS.get(price) ?? { totalQty: 0, orders: [] };
    level.orders.push(order);
    level.totalQty += order.qty - order.filledQty;
    book.ASKS.set(price, level);
  },

  removeOrder(
    symbol: string,
    side: "BIDS" | "ASKS",
    price: number,
    orderId: number,
  ): BookOrder | null {
    const book = this.get(symbol);
    const level = book[side].get(price);
    if (!level) {
      return null;
    }

    const index = level.orders.findIndex((order) => order.orderId === orderId);
    if (index === -1) {
      return null;
    }

    const [removed] = level.orders.splice(index, 1);
    if (!removed) {
      return null;
    }

    level.totalQty -= removed.qty - removed.filledQty;

    if (level.orders.length === 0) {
      book[side].delete(price);
    } else {
      book[side].set(price, level);
    }

    return removed;
  },

  getDepth(symbol: string) {
    const book = this.get(symbol);

    const bids = [...book.BIDS.entries()]
      .map(([price, level]) => [price, level.totalQty] as const)
      .sort((a, b) => b[0] - a[0]);

    const asks = [...book.ASKS.entries()]
      .map(([price, level]) => [price, level.totalQty] as const)
      .sort((a, b) => a[0] - b[0]);

    return { symbol, bids, asks };
  },

  getBestAsks(symbol: string): Array<[number, PriceLevel]> {
    return [...this.get(symbol).ASKS.entries()].sort((a, b) => a[0] - b[0]);
  },

  getBestBids(symbol: string): Array<[number, PriceLevel]> {
    return [...this.get(symbol).BIDS.entries()].sort((a, b) => b[0] - a[0]);
  },
};
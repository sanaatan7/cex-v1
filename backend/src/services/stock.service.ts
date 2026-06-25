import { prisma } from "../../lib/prisma";
import { AppError } from "../middlewares/errorHandler";

const DEFAULT_STOCKS = [
  { title: "BTC", symbol: "BTC" },
  { title: "SOL", symbol: "SOL" },
];

export const stockService = {
  async seedDefaults(): Promise<void> {
    for (const stock of DEFAULT_STOCKS) {
      await prisma.stocks.upsert({
        where: { title: stock.title },
        update: { symbol: stock.symbol },
        create: stock,
      });
    }
  },

  async findByMarketId(marketId: string) {
    const stock = await prisma.stocks.findFirst({
      where: {
        OR: [{ title: marketId }, { symbol: marketId }],
      },
    });

    if (!stock) {
      throw new AppError(404, `Market '${marketId}' not found`);
    }

    return stock;
  },

  async findBySymbol(symbol: string) {
    const stock = await prisma.stocks.findFirst({
      where: {
        OR: [{ symbol }, { title: symbol }],
      },
    });

    if (!stock) {
      throw new AppError(404, `Symbol '${symbol}' not found`);
    }

    return stock;
  },
};
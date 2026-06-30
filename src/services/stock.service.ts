import { prisma } from "../../lib/prisma";

const DEFAULT_STOCKS = [
  { title: "BTC", symbol: "BTC" },
  { title: "SOL", symbol: "SOL" },
];

export const stockService = {
  async seedDefaults() {
    for (const stock of DEFAULT_STOCKS) {
      await prisma.stock.upsert({
        where: { title: stock.title },
        update: { symbol: stock.symbol },
        create: stock,
      });
    }
  },
};

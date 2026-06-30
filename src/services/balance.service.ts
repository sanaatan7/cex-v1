import { AppError } from "../middlewares/errorHandler";

const INITIAL_USD = 100_000;

type AssetBalances = Record<string, number>;

export type UserBalance = {
  usd: number;
  lockedUsd: number;
  stocks: AssetBalances;
  lockedStocks: AssetBalances;
};

const balances = new Map<number, UserBalance>();

const emptyStocks = (): AssetBalances => ({});

export const balanceServices = {
  initUser(userId: number): UserBalance {
    const balance: UserBalance = {
      usd: INITIAL_USD,
      lockedUsd: 0,
      stocks: emptyStocks(),
      lockedStocks: emptyStocks(),
    };
    balances.set(userId, balance);
    return balance;
  },

  getOrCreate(userId: number): UserBalance {
    const existing = balances.get(userId)
    if (existing) {
      return existing
    }
    return this.initUser(userId)
  }
};

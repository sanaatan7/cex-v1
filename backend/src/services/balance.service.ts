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

export const balanceService = {
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
    const existing = balances.get(userId);
    if (existing) {
      return existing;
    }
    return this.initUser(userId);
  },

  getUsdBalance(userId: number): number {
    const balance = this.getOrCreate(userId);
    return balance.usd;
  },

  getAllBalances(userId: number): { usd: number; stocks: AssetBalances } {
    const balance = this.getOrCreate(userId);
    return {
      usd: balance.usd,
      stocks: { ...balance.stocks },
    };
  },

  lockUsd(userId: number, amount: number): void {
    const balance = this.getOrCreate(userId);
    if (balance.usd < amount) {
      throw new AppError(400, "Insufficient USD balance");
    }
    balance.usd -= amount;
    balance.lockedUsd += amount;
  },

  unlockUsd(userId: number, amount: number): void {
    const balance = this.getOrCreate(userId);
    if (balance.lockedUsd < amount) {
      throw new AppError(400, "Cannot unlock more USD than locked");
    }
    balance.lockedUsd -= amount;
    balance.usd += amount;
  },

  spendLockedUsd(userId: number, amount: number): void {
    const balance = this.getOrCreate(userId);
    if (balance.lockedUsd < amount) {
      throw new AppError(400, "Insufficient locked USD");
    }
    balance.lockedUsd -= amount;
  },

  creditUsd(userId: number, amount: number): void {
    const balance = this.getOrCreate(userId);
    balance.usd += amount;
  },

  lockStock(userId: number, symbol: string, qty: number): void {
    const balance = this.getOrCreate(userId);
    const available = balance.stocks[symbol] ?? 0;
    if (available < qty) {
      throw new AppError(400, `Insufficient ${symbol} balance`);
    }
    balance.stocks[symbol] = available - qty;
    balance.lockedStocks[symbol] = (balance.lockedStocks[symbol] ?? 0) + qty;
  },

  unlockStock(userId: number, symbol: string, qty: number): void {
    const balance = this.getOrCreate(userId);
    const locked = balance.lockedStocks[symbol] ?? 0;
    if (locked < qty) {
      throw new AppError(400, `Cannot unlock more ${symbol} than locked`);
    }
    balance.lockedStocks[symbol] = locked - qty;
    balance.stocks[symbol] = (balance.stocks[symbol] ?? 0) + qty;
  },

  spendLockedStock(userId: number, symbol: string, qty: number): void {
    const balance = this.getOrCreate(userId);
    const locked = balance.lockedStocks[symbol] ?? 0;
    if (locked < qty) {
      throw new AppError(400, `Insufficient locked ${symbol}`);
    }
    balance.lockedStocks[symbol] = locked - qty;
  },

  creditStock(userId: number, symbol: string, qty: number): void {
    const balance = this.getOrCreate(userId);
    balance.stocks[symbol] = (balance.stocks[symbol] ?? 0) + qty;
  },
};
import type { Request, Response } from "express";
import { AppError } from "../middlewares/errorHandler";
import { balanceService } from "../services/balance.service";

export const balanceController = {
  async getUsd(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
      throw new AppError(401, "Unauthorized");
    }

    const usd = balanceService.getUsdBalance(userId);
    res.status(200).json({ usd });
  },

  async getAll(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
      throw new AppError(401, "Unauthorized");
    }

    const balances = balanceService.getAllBalances(userId);
    res.status(200).json(balances);
  },
};
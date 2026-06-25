import type { Request, Response } from "express";
import { orderbookService } from "../services/orderbook.service";
import { stockService } from "../services/stock.service";

export const marketController = {
  async getDepth(req: Request, res: Response) {
    await stockService.findBySymbol(req.params.symbol);
    const depth = orderbookService.getDepth(req.params.symbol);
    res.status(200).json(depth);
  },
};
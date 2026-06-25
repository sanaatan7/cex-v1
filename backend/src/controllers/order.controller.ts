import type { Request, Response } from "express";
import { AppError } from "../middlewares/errorHandler";
import { orderService } from "../services/order.service";

export const orderController = {
  async create(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
      throw new AppError(401, "Unauthorized");
    }

    const result = await orderService.create(userId, req.body);
    res.status(201).json(result);
  },

  async getById(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
      throw new AppError(401, "Unauthorized");
    }

    const order = await orderService.getById(userId, req.params.orderId);
    res.status(200).json(order);
  },

  async cancel(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
      throw new AppError(401, "Unauthorized");
    }

    const order = await orderService.cancel(userId, req.params.orderId);
    res.status(200).json({
      message: "Order cancelled",
      order,
    });
  },

  async list(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
      throw new AppError(401, "Unauthorized");
    }

    const orders = await orderService.listByUser(userId);
    res.status(200).json(orders);
  },

  async listFills(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
      throw new AppError(401, "Unauthorized");
    }

    const fills = await orderService.listFillsByUser(userId);
    res.status(200).json(fills);
  },
};
import express from "express";
import "dotenv/config";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from "./routes/auth.routes";
import balanceRoutes from "./routes/balance.routes";
import marketRoutes from "./routes/market.routes";
import orderRoutes from "./routes/order.routes";
import { stockService } from "./services/stock.service";

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(authRoutes);
  app.use(orderRoutes);
  app.use(balanceRoutes);
  app.use(marketRoutes);

  app.use(errorHandler);

  return app;
};

export const bootstrap = async () => {
  await stockService.seedDefaults();
};
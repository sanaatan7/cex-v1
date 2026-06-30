import express from "express";
import { stockService } from "./services/stock.service";
import authRoutes from "./routes/auth.routes";

export const createApp = () => {
  const app = express();
  app.use(express.json());

  app.use(authRoutes);
  return app;
};

export const bootstrap = async () => {
  await stockService.seedDefaults();
};

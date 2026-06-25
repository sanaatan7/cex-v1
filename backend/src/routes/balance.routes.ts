import { Router } from "express";
import { balanceController } from "../controllers/balance.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import verifyToken from "../middlewares/verifyToken";
import verifyUser from "../middlewares/verifyUser";

const router = Router();

router.get(
  "/balance/usd",
  verifyToken,
  verifyUser,
  asyncHandler(balanceController.getUsd),
);

router.get(
  "/balance",
  verifyToken,
  verifyUser,
  asyncHandler(balanceController.getAll),
);

export default router;
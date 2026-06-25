import { Router } from "express";
import { marketController } from "../controllers/market.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { validate } from "../middlewares/validate";
import { symbolParamSchema } from "../schemas/order.schema";

const router = Router();

router.get(
  "/depth/:symbol",
  validate({ params: symbolParamSchema }),
  asyncHandler(marketController.getDepth),
);

export default router;
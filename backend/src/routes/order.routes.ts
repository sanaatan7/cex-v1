import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import verifyToken from "../middlewares/verifyToken";
import verifyUser from "../middlewares/verifyUser";
import { validate } from "../middlewares/validate";
import {
  createOrderSchema,
  orderIdParamSchema,
} from "../schemas/order.schema";

const router = Router();

router.post(
  "/order",
  verifyToken,
  verifyUser,
  validate({ body: createOrderSchema }),
  asyncHandler(orderController.create),
);

router.get(
  "/order/:orderId",
  verifyToken,
  verifyUser,
  validate({ params: orderIdParamSchema }),
  asyncHandler(orderController.getById),
);

router.delete(
  "/order/:orderId",
  verifyToken,
  verifyUser,
  validate({ params: orderIdParamSchema }),
  asyncHandler(orderController.cancel),
);

router.get(
  "/orders",
  verifyToken,
  verifyUser,
  asyncHandler(orderController.list),
);

router.get(
  "/fills",
  verifyToken,
  verifyUser,
  asyncHandler(orderController.listFills),
);

export default router;
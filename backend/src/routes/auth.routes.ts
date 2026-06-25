import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { validate } from "../middlewares/validate";
import { signinSchema, signupSchema } from "../schemas/auth.schema";

const router = Router();

router.post(
  "/signup",
  validate({ body: signupSchema }),
  asyncHandler(authController.signup),
);

router.post(
  "/signin",
  validate({ body: signinSchema }),
  asyncHandler(authController.signin),
);

export default router;
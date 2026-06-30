import { Router } from "express";
import verifyToken from "../middlewares/verifyToken";
import verifyUser from "../middlewares/verifyUser";

const router = Router();


router.get("/balance/usd", verifyToken, verifyUser)

export default router;

import "dotenv/config";
import type { Response, Request, NextFunction } from "express";
import { AppError } from "./errorHandler";
import jwt, { type JwtPayload } from "jsonwebtoken";
const verifyToken = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    next(new AppError(401, "Credentials Missing"));
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      `${process.env.JWT_SECRET}`,
    ) as JwtPayload;

    if (!decoded.username) {
      next(new AppError(401, "Invalid token"));
      return;
    }
    req.username = decoded.username;
    req.tokenPayload = decoded;
    next();
  } catch {
    next(new AppError(401, "Invalid Or Expired token"));
  }
};

export default verifyToken;

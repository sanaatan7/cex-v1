import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { AppError } from "./errorHandler";

const verifyToken = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    next(new AppError(401, "Credentials missing"));
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
    next(new AppError(401, "Invalid or expired token"));
  }
};

export default verifyToken;
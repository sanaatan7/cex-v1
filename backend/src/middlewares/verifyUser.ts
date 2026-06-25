import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { AppError } from "./errorHandler";

const verifyUser = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const username = req.username;

  if (!username) {
    next(new AppError(401, "Credentials missing"));
    return;
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    next(new AppError(401, "Invalid token"));
    return;
  }

  req.userId = user.id;
  next();
};

export default verifyUser;
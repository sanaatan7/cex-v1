import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      username?: string;
      userId?: number;
      tokenPayload?: JwtPayload;
    }
  }
}

export {};

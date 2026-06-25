import type { Request, Response } from "express";
import { authService } from "../services/auth.service";

export const authController = {
  async signup(req: Request, res: Response) {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  },

  async signin(req: Request, res: Response) {
    const result = await authService.signin(req.body);
    res.status(200).json(result);
  },
};
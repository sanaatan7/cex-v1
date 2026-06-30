import { json, type Request, type Response } from "express";
import { authService } from "../services/auth.service";
import { signupSchema, signinSchema } from "../schemas/auth.schema";

export const authController = {
  async signup(req: Request, res: Response) {
    const { data, success, error } = signupSchema.safeParse(req.body);
    if (error) {
      res.status(402).json({ message: "Invalid format: ", error });
      return;
    }
    const result = await authService.signup(data);

    res.status(201).json(result);
  },

  async signin(req: Request, res: Response) {
    const { data, success, error } = signinSchema.safeParse(req.body);
    if (error) {
      res.status(402).json("Invalid format");
      return;
    }
    const result = await authService.signin(data);
    res.status(200).json(result);
  },
};

import "dotenv/config";
import { prisma } from "../../lib/prisma";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { SignupInput, SigninInput } from "../schemas/auth.schema";
import { AppError } from "../middlewares/errorHandler";
import { balanceServices } from "./balance.service";

export const authService = {
  async signup(input: SignupInput) {
    const existing = await prisma.user.findUnique({
      where: { username: input.username },
    });
    if (existing) {
      throw new AppError(409, "User Already Exists");
    }

    const hashedPassword = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });
    const user = await prisma.user.create({
      data: {
        username: input.username,
        password: hashedPassword,
        age: input.age,
      },
    });
    balanceServices.initUser(user.id);
    return { message: "SignUp Successful" };
  },

  async signin(input: SigninInput) {
    const user = await prisma.user.findUnique({
      where: { username: input.username },
    });

    if (!user) {
      throw new AppError(404, "User doesn't exist. Sign up first");
    }

    const validPassword = await argon2.verify(user.password, input.password);
    if (!validPassword) {
      throw new AppError(401, "Invalid Credentials");
    }
    balanceServices.getOrCreate(user.id);
    const token = jwt.sign(
      { id: user.id, username: user.username },
      `${process.env.JWT_SECRET}`,
      { expiresIn: "9h" },
    );

    return { message: "Signin Successful", token };
  },
};

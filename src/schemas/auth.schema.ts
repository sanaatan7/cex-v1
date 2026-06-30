import { z } from "zod";

export const signupSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(128),
  age: z.number().int().min(15).max(120).optional(),
});

export const signinSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(128),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;

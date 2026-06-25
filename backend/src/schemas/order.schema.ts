import { z } from "zod";

export const createOrderSchema = z
  .object({
    type: z.enum(["market", "limit"]),
    price: z.number().int().positive().nullable(),
    qty: z.number().int().positive(),
    market_id: z.string().min(1),
    side: z.enum(["buy", "sell"]),
  })
  .superRefine((data, ctx) => {
    if (data.type === "limit" && data.price === null) {
      ctx.addIssue({
        code: "custom",
        message: "price is required for limit orders",
        path: ["price"],
      });
    }
    if (data.type === "market" && data.price !== null) {
      ctx.addIssue({
        code: "custom",
        message: "price must be null for market orders",
        path: ["price"],
      });
    }
  });

export const orderIdParamSchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

export const symbolParamSchema = z.object({
  symbol: z.string().min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
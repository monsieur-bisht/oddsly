import { z } from "zod";

export const registerBody = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  // bcrypt only reads the first 72 BYTES, so cap bytes, not characters.
  password: z
    .string()
    .min(10, "At least 10 characters")
    .refine((p) => Buffer.byteLength(p) <= 72, "Too long (max 72 bytes)"),
});

export const loginBody = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(1).max(72),
});

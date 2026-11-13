import { z } from "zod";
import { pagination } from "./common.js";

const price = z.number().int().min(1).max(99);
const isoDate = z.coerce.date();

export const createMarketBody = z
  .strictObject({
    title: z.string().trim().min(5).max(200),
    description: z.string().trim().max(2000).optional(),
    category: z.string().trim().toLowerCase().min(2).max(40),
    yesPrice: price,
    endDate: isoDate.refine((d) => d.getTime() > Date.now(), "endDate must be in the future"),
  });

export const updateMarketBody = z
  .strictObject({
    title: z.string().trim().min(5).max(200),
    description: z.string().trim().max(2000),
    category: z.string().trim().toLowerCase().min(2).max(40),
    yesPrice: price,
    endDate: isoDate,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Provide at least one field");

export const listMarketsQuery = z.object({
  ...pagination,
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().toLowerCase().max(40).optional(),
  status: z.enum(["OPEN", "CLOSED", "RESOLVED"]).optional(),
  sort: z.enum(["newest", "ending"]).default("newest"),
});

export const resolveBody = z.strictObject({ outcome: z.enum(["YES", "NO"]) });

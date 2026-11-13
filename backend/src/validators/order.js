import { z } from "zod";
import { objectId, pagination } from "./common.js";

// Deliberately NO price or balance fields: the server reads those from the database.
// strictObject rejects any extra field a client might try to sneak in.
export const createOrderBody = z.strictObject({
  marketId: objectId,
  side: z.enum(["YES", "NO"]),
  quantity: z.number().int().min(1).max(10_000),
});

export const pageQuery = z.object({ ...pagination });

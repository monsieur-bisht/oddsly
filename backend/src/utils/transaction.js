import mongoose from "mongoose";

/**
 * Runs `fn(session)` inside a MongoDB transaction. Retries on transient errors.
 * `fn` may run more than once, so keep side effects inside the session.
 */
export async function withTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

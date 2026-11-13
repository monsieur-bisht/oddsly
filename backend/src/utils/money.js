// All money is stored as integer cents. 1 credit = 100 cents.
// A contract pays out exactly 100 cents (1 credit) if it wins.
export const CENTS_PER_CREDIT = 100;
export const CONTRACT_PAYOUT = 100;
export const STARTING_BALANCE = 10_000 * CENTS_PER_CREDIT;

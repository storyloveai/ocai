import { createCredits } from "./credits.js";
// Signed Stripe fulfillment and chat reservations mutate the same schema.
export function createWallet(
  db,
  mode,
  { checkinCredits = 100, checkinDays = 7 } = {},
) {
  const store = createCredits(db, mode);
  return {
    async rpc(name, { p_user: uid, p_session: session, p_credits: amount }) {
      if (name === "storylove_wallet") return store.read(uid);
      if (name === "storylove_purchase_status")
        return store.purchased(uid, session);
      if (name === "storylove_purchase")
        return store.purchase(uid, session, amount);
      if (name === "storylove_checkin")
        return store.checkin(uid, {
          amount: checkinCredits,
          days: checkinDays,
        });
      throw Error("Unsupported wallet operation");
    },
  };
}

import { createHash } from 'node:crypto';

// Admin-only collections. Browser rules intentionally grant no access here.
// Test and live balances, receipts and daily claims have separate paths.
export function createWallet(db, mode) {
  if (!['test', 'live'].includes(mode)) throw Error('Invalid wallet mode');
  return { async rpc(name, { p_user: uid, p_session: session, p_credits: credits }) {
    if (typeof uid !== 'string' || !uid || uid.length > 128) throw Error('Invalid UID');
    const key = createHash('sha256').update(uid).digest('hex');
    const wallet = db.collection(`replica-wallets-${mode}`).doc(key);
    const receipts = db.collection(`replica-receipts-${mode}`);
    if (name === 'storylove_purchase_status') {
      const receipt = await receipts.doc(session).get();
      return receipt.exists && receipt.data().uid === uid;
    }
    return db.runTransaction(async tx => {
      const snapshot = await tx.get(wallet);
      const data = snapshot.exists ? snapshot.data() : { balance: 0, checkedDay: null, ledger: [] };
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      let claimed = false;
      const entry = (amount, type, id) => {
        data.balance += amount;
        data.ledger = [{ amount, type, id, at: new Date().toISOString() }, ...data.ledger].slice(0, 50);
      };
      if (name === 'storylove_purchase') {
        if (!/^cs_[\w]+$/.test(session || '') || ![200, 2500, 5000].includes(credits)) throw Error('Invalid purchase');
        const receipt = receipts.doc(session);
        const previous = await tx.get(receipt);
        if (previous.exists) {
          if (previous.data().uid !== uid || previous.data().credits !== credits) throw Error('Receipt conflict');
        } else {
          entry(credits, 'purchase', session);
          tx.create(receipt, { uid, credits, at: new Date().toISOString() });
          tx.set(wallet, { ...data, uid });
        }
      } else if (name === 'storylove_checkin') {
        if (data.checkedDay !== today) {
          data.checkedDay = today; claimed = true;
          entry(100, 'checkin', today);
          tx.set(wallet, { ...data, uid });
        }
      } else if (name !== 'storylove_wallet') throw Error('Unsupported wallet operation');
      return { balance: data.balance, checked: data.checkedDay === today, ledger: data.ledger, claimed };
    });
  } };
}

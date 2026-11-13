// Operational snapshot only: never normalize/mutate a wallet or expose identifiers.
const sources = ['grant', 'purchased', 'legacy'];
const units = v => Number.isSafeInteger(v) && v >= 0;
export function createWalletReport() {
  return {accounts: 0, legacyWallets: 0, available: 0, reserved: 0,
    issued: {grant: 0, purchased: 0, legacy: 0}, spent: {grant: 0, purchased: 0, legacy: 0},
    expired: {total: 0}, reversed: {purchased: 0}, uncoveredCredits: 0,
    fundingPausedAccounts: 0, openFundingHolds: 0, invalidWallets: 0, unbalancedWallets: 0};
}
export function addWalletReport(report, wallet) {
  report.accounts++;
  if (!wallet || !units(wallet.balance)) { report.invalidWallets++; return; }
  if (wallet.schema !== undefined && wallet.schema !== 1 && wallet.schema !== 2) { report.invalidWallets++; return; }
  if (wallet.schema !== 2) {
    report.legacyWallets++;
    report.available += wallet.balance;
    report.issued.legacy += wallet.balance;
    return;
  }
  const reserved = Object.values(wallet.holds || {}).map(h => h?.amount);
  const issued = sources.map(s => wallet.stats?.issued?.[s]);
  const spent = sources.map(s => wallet.stats?.spent?.[s]);
  const expired = wallet.stats?.expired, reversed = wallet.stats?.reversed?.purchased ?? 0, debt = wallet.debt ?? 0;
  if (![...reserved, ...issued, ...spent, expired, reversed, debt].every(units)) {
    report.invalidWallets++; return;
  }
  const sum = values => values.reduce((n, v) => n + v, 0);
  const held = sum(reserved), disputes = Object.keys(wallet.fundingHolds || {}).length;
  report.available += wallet.balance; report.reserved += held;
  sources.forEach((s, i) => { report.issued[s] += issued[i]; report.spent[s] += spent[i]; });
  report.expired.total += expired; report.reversed.purchased += reversed; report.uncoveredCredits += debt;
  report.openFundingHolds += disputes;
  if (debt > 0 || disputes > 0) report.fundingPausedAccounts++;
  if (sum(issued) !== wallet.balance + held + sum(spent) + expired + reversed - debt) report.unbalancedWallets++;
}
export function finishWalletReport(report, {mode = 'test', truncated = false} = {}) {
  const sum = values => Object.values(values).reduce((n, v) => n + v, 0);
  const conservationDelta = sum(report.issued) - (report.available + report.reserved + sum(report.spent) + report.expired.total + report.reversed.purchased - report.uncoveredCredits);
  return {mode, ...report, conservationDelta, truncated,
    consistentSnapshot: !truncated && report.invalidWallets === 0 && report.unbalancedWallets === 0 && conservationDelta === 0,
    completeHistory: !truncated && report.legacyWallets === 0 && report.invalidWallets === 0,
    note: 'Credit units, not money, revenue or provider cost. Reversed units are net of restored disputes; uncovered credits are current unbacked units. Gifts are never revenue. Read-only snapshot: expired lots/leases may await next wallet access; pagination is not a global transaction. Legacy history is unknown. Use durable ledger and Stripe receipts for financial reconciliation.'};
}

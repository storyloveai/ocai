// Guest data stays separate. Signing in never assigns this device's guest history to an account.
export function createAccountStorage(storage) {
  let uid = null;
  const keyFor = key => uid ? `ooc-user:${uid}:${key}` : key;
  return {
    useAccount(value) { uid = value || null; },
    read(key, fallback) { try { return JSON.parse(storage.getItem(keyFor(key))) ?? fallback; } catch { return fallback; } },
    save(key, value) { storage.setItem(keyFor(key), JSON.stringify(value)); },
  };
}
export const cloudKey = key => /^ooc-(profile|onboarding-complete|favorites|history|custom|preference|avatar|chat-.+|session-v2-.+|comments-.+|User Note-.+|Memories-.+|output-length|model-tier|response-mode)$/.test(key);

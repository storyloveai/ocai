import { createHmac } from 'node:crypto';
// Instance-local fallback; hosting-level IP limits should also be enabled.
export function createGuestLimiter({ now = Date.now, limit = 8, maxKeys = 10000 } = {}) {
  const windows = new Map();
  return req => {
    const key = req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-nf-client-connection-ip') || 'local';
    const time = now();
    for (const [id, window] of windows) if (time - window.start >= 60000) windows.delete(id);
    let window = windows.get(key);
    if (!window) {
      if (windows.size >= maxKeys) return false;
      window = { start: time, requests: 0 }; windows.set(key, window);
    }
    return ++window.requests <= limit;
  };
}

export function guestKey(req, secret) {
  const ip = req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  return createHmac('sha256', secret).update(ip).digest('hex');
}

import { platform } from './payments.js';
export function paymentHandler(action, handlers = platform) {
  return async (req, res) => {
    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) if (value != null) headers.set(key, Array.isArray(value) ? value.join(',') : value);
      let body;
      if (!['GET', 'HEAD'].includes(req.method)) {
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += Buffer.byteLength(chunk);
          if (size > (action === 'webhook' ? 262144 : 2000)) return res.status(413).json({ error: 'Request too large' });
          chunks.push(Buffer.from(chunk));
        }
        body = Buffer.concat(chunks);
      }
      const request = new Request(`https://${req.headers.host}${req.url}`, { method: req.method, headers, ...(body ? { body } : {}) });
      const result = await handlers[action](request);
      res.setHeader('Cache-Control', 'no-store');
      res.status(result.status).json(await result.json());
    } catch { res.status(503).json({ error: '服务暂时不可用，请重试。' }); }
  };
}

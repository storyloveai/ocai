// Observe completion while forwarding bytes immediately; never buffer a live reply.
export function observeCreditResponse(response, payment, onState = () => {}) {
  if (!payment) return response;
  const notify = state => { try { onState(state); } catch {} };
  const complete = data => {
    if (data.billing?.status === 'settled' || (!data.billing && data.replayed)) {
      payment.complete(); notify('settled');
    } else if (data.billing?.status === 'released') {
      payment.complete(false); notify('released');
    } else notify('unconfirmed');
  };
  if (!response.ok) { notify('failed'); return response; }
  if (
    !(response.headers.get("content-type") || "").includes(
      "application/x-ndjson",
    )
  ) {
    return response.json().then((data) => {
      if (!payment.current())
        throw Object.assign(Error("账号已更换。"), { code: "ACCOUNT_CHANGED" });
      complete(data);
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: response.headers,
      });
    });
  }
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "", finalEvent = false;
  const body = new ReadableStream({
    async pull(controller) {
      try {
        if (!payment.current())
          throw Object.assign(Error("账号已更换。"), {
            code: "ACCOUNT_CHANGED",
          });
        const next = await reader.read();
        if (!payment.current())
          throw Object.assign(Error("账号已更换。"), {code: "ACCOUNT_CHANGED"});
        if (next.done) {
          if (!finalEvent) notify('interrupted');
          controller.close();
          return;
        }
        buffer += decoder.decode(next.value, { stream: true });
        let index;
        while ((index = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, index);
          buffer = buffer.slice(index + 1);
          if (line.trim()) {
            const event = JSON.parse(line);
            if (event.type === "done") { finalEvent = true; complete(event); }
            else if (event.type === "error") { finalEvent = true; notify('failed'); }
          }
        }
        controller.enqueue(next.value);
      } catch (e) {
        notify('interrupted');
        await reader.cancel().catch(() => {});
        controller.error(e);
      }
    },
    cancel: (reason) => { notify('interrupted'); return reader.cancel(reason); },
  });
  return new Response(body, {
    status: response.status,
    headers: response.headers,
  });
}

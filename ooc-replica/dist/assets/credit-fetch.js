// Observe completion while forwarding bytes immediately; never buffer a live reply.
export function observeCreditResponse(response, payment) {
  if (!payment) return response;
  if (!response.ok) return response;
  if (
    !(response.headers.get("content-type") || "").includes(
      "application/x-ndjson",
    )
  ) {
    return response.json().then((data) => {
      if (!payment.current())
        throw Object.assign(Error("账号已更换。"), { code: "ACCOUNT_CHANGED" });
      if (data.billing) payment.complete(data.billing.status === "settled");
      else if (data.replayed) payment.complete();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: response.headers,
      });
    });
  }
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "";
  const body = new ReadableStream({
    async pull(controller) {
      try {
        if (!payment.current())
          throw Object.assign(Error("账号已更换。"), {
            code: "ACCOUNT_CHANGED",
          });
        const next = await reader.read();
        if (next.done) {
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
            if (event.type === "done")
              payment.complete(event.billing?.status !== "released");
          }
        }
        controller.enqueue(next.value);
      } catch (e) {
        await reader.cancel().catch(() => {});
        controller.error(e);
      }
    },
    cancel: (reason) => reader.cancel(reason),
  });
  return new Response(body, {
    status: response.status,
    headers: response.headers,
  });
}

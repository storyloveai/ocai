// Generate a short loop of filtered noise only after the reader requests sound.
export function createRain(win) {
  let context, source;
  let revision = 0;
  function stop() {
    revision++;
    if (source) {
      source.stop();
      source.disconnect();
      source = undefined;
    }
    if (context && context.state !== 'closed') void context.close().catch(() => {});
    context = undefined;
  }
  async function start() {
    stop();
    const request = revision;
    try {
      const Audio = win.AudioContext || win.webkitAudioContext;
      if (!Audio) return false;
      const ctx = new Audio();
      context = ctx;
      await ctx.resume();
      if (request !== revision) return false;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < samples.length; i++) {
        last = last * .82 + (Math.random() * 2 - 1) * .18;
        samples[i] = last;
      }
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      node.loop = true;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(.18, ctx.currentTime + .4);
      node.connect(gain).connect(ctx.destination);
      source = node;
      node.start();
      return true;
    } catch {
      if (request === revision) stop();
      return false;
    }
  }
  return {start, stop};
}

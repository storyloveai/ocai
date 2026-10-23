// Usage analytics through PostHog (https://posthog.com). Off on localhost, in automated browsers and in tests.
// No session recording; the text of chats and story choices is never sent (see scrub below).
// The project key is a public, write-only key that every visitor's browser receives anyway; it is not a secret.
export const POSTHOG_KEY = 'phc_ycJeeFsevXgnH7LBPFuKYKDTPzWtND29su2AchSen3Ak';
export const POSTHOG_HOST = 'https://us.i.posthog.com';

let on = false;

export function analyticsAllowed(win = globalThis) {
  const host = win.location?.hostname || '';
  if (!win.document?.createElement || !win.navigator || win.navigator.webdriver) return false;
  return !!host && !['localhost', '127.0.0.1', '0.0.0.0'].includes(host) && !host.endsWith('.local');
}

// $autocapture records which element was clicked; strip the element's text so story and chat words never leave
export function scrub(event) {
  if (!event || !event.properties) return event;
  if (event.event === '$autocapture') {
    const p = event.properties;
    delete p.$el_text;
    if (Array.isArray(p.$elements)) p.$elements = p.$elements.map(({$el_text, ...rest}) => rest);
    if (typeof p.$elements_chain === 'string') p.$elements_chain = p.$elements_chain.replace(/text="(?:[^"\\]|\\.)*"/g, '');
  }
  return event;
}

export function startAnalytics(win = globalThis) {
  if (on || !analyticsAllowed(win)) return false;
  try {
    // PostHog's standard loader: a stub that queues calls until /static/array.js arrives
    /* eslint-disable */
    !function(t,e){var o,n,p,r;e.__SV||(win.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]||t.head.lastChild).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister identify setPersonProperties reset get_distinct_id opt_in_capturing opt_out_capturing has_opted_out_capturing set_config".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(win.document,win.posthog||[]);
    /* eslint-enable */
    win.posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: 'history_change',
      capture_pageleave: true,
      disable_session_recording: true,
      respect_dnt: true,
      before_send: scrub,
    });
    on = true;
  } catch { on = false; }
  return on;
}

const ph = () => (on ? globalThis.posthog : null);
export function track(name, props = {}) { try { ph()?.capture(name, props); } catch {} }
// signed-in visitors are identified by their account id only (no email or name)
export function identify(uid) { try { if (uid) ph()?.identify(uid); } catch {} }
export function forget() { try { ph()?.reset(); } catch {} }

// Three Kingdoms progress, read from the run list the game saves through the site (no change to the game needed)
export function gameTracker(base, send = track, now = Date.now()) {
  const opened = now; let last = null;
  return runs => {
    const m = Array.isArray(runs) ? runs[0] : null; if (!m || typeof m !== 'object') return;
    const info = {...base, vol: m.vol, chapter: (m.ch ?? 0) + 1, chapter_id: m.chap, scene: m.node, preset: m.preset || null};
    const fresh = !last || last.id !== m.id, baseline = fresh && !(m.created >= opened - 5000); // a run from before this visit
    if (fresh && !baseline) send('game_run_started', info);
    if ((fresh && !baseline) || (!fresh && m.ch > last.ch)) send('game_chapter_reached', info);
    if (!fresh && m.node !== last.node && m.status !== 'end') send('game_scene', info);
    if (m.status === 'end' && !baseline && (fresh || last.status !== 'end')) send('game_volume_ended', {...info, early: !!m.early, endings: (m.frags || []).length});
    last = {id: m.id, ch: m.ch, node: m.node, status: m.status};
  };
}

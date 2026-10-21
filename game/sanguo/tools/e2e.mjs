// Headless playthrough: node tools/e2e.mjs <outdir>
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || "playwright");
import path from "path"; import url from "url";
const R = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2] || "/tmp";
const page_url = url.pathToFileURL(path.join(R, "web/index.html")).href + "#creator";
const browser = await chromium.launch();
const errs = [];
async function run(lang, strategy, w, hgt, tag) {
  const ctx = await browser.newContext({ viewport: { width: w, height: hgt }, locale: lang === "zh" ? "zh-CN" : "en-US", colorScheme: tag.includes("light") ? "light" : "dark" });
  const p = await ctx.newPage();
  p.on("pageerror", e => errs.push(tag + ": " + e.message));
  p.on("console", m => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(tag + " console: " + m.text()); });
  await p.goto(page_url);
  await p.screenshot({ path: `${OUT}/${tag}-start.png` });
  await p.click(".volcard .btn");
  let steps = 0, typed = false, talked = false, shotTalk = false;
  while (steps++ < 120) {
    if (await p.$(".epi")) break;
    const card = await p.$$(".offer .card");
    if (card.length) { await card[strategy === "first" ? 0 : card.length - 1].click(); continue; }
    if (!typed && strategy === "last") {
      // free text: foresight + a line that should match a choice
      typed = true;
      await p.fill(".free input", lang === "zh" ? "赤壁会有一场大火" : "There will be a great fire at Red Cliffs");
      await p.click(".free button"); await p.waitForTimeout(100);
      continue;
    }
    if (await p.$(".ask input")) { // open question: answer in words
      await p.fill(".ask input", lang === "zh" ? (strategy === "first" ? "我看是我家主公" : "不好说") : (strategy === "first" ? "My own lord, I'd say" : "I can't say")); await p.click(".ask button"); await p.waitForTimeout(150); continue;
    }
    const tps = await p.$$(".topic:not([disabled])");
    if (tps.length && !(await p.$eval(".turns", e => e.textContent)).includes(lang === "zh" ? "夜深" : "late")) {
      if (strategy === "last" && !talked) { talked = true; await p.fill(".free input", lang === "zh" ? "你觉得今晚的风大吗？" : "Do you think the wind is strong tonight?"); await p.click(".free button"); await p.waitForTimeout(100); continue; }
      await tps[0].click(); if (!shotTalk) { shotTalk = true; await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/${tag}-talk.png` }); } continue;
    }
    const opts = await p.$$(".choice:not([disabled])");
    if (!opts.length) throw new Error(tag + " stuck at step " + steps);
    await opts[strategy === "first" ? 0 : opts.length - 1].click();
    if (steps === 6 || steps === 14) { await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/${tag}-mid${steps}.png`, fullPage: false }); }
  }
  await p.waitForTimeout(400);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (over > 0) errs.push(`${tag}: horizontal overflow ${over}px`);
  // open all why chains
  await p.$$eval(".frag details", ds => ds.forEach(d => d.open = true));
  await p.screenshot({ path: `${OUT}/${tag}-end.png`, fullPage: true });
  const text = await p.$eval("#story", e => { const c = e.cloneNode(true); c.querySelectorAll("svg").forEach(x => x.remove()); document.body.append(c); const t = c.innerText; c.remove(); return t; });
  const cjk = (text.match(/[一-鿿]/g) || []).length;
  if (lang === "en" && cjk > 0) errs.push(`${tag}: ${cjk} Chinese chars in English transcript: ` + (text.match(/.{0,20}[一-鿿]+.{0,20}/) || [""])[0]);
  // switch language: transcript must re-render fully in the other language
  await p.click(`.seg button:nth-child(${lang === "zh" ? 2 : 1})`);
  const t2 = await p.$eval("#story", e => { const c = e.cloneNode(true); c.querySelectorAll("svg, .you").forEach(x => x.remove()); document.body.append(c); const t = c.innerText; c.remove(); return t; });
  const cjk2 = (t2.match(/[一-鿿]/g) || []).length;
  if (lang === "zh" && cjk2 > 0) errs.push(`${tag}: after switching to EN, ${cjk2} Chinese chars remain: ` + (t2.match(/.{0,20}[一-鿿]+.{0,20}/) || [""])[0]);
  // creator view + simulator
  await p.click(".top .tbtn >> nth=-1");
  if (w < 900) await p.click("#fab");
  await p.click('.tabs button:nth-child(5)');
  await p.click(".sec .btn"); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${tag}-creator.png`, fullPage: false });
  const simOK = await p.$$eval(".dist .bar", b => b.length);
  if (!simOK) errs.push(tag + ": simulator rendered nothing");
  await p.click('.tabs button:nth-child(4)'); await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/${tag}-gallery.png`, fullPage: false });
  const gal = await p.$$eval(".gal .ok", x => x.length);
  if (!gal) errs.push(tag + ": gallery shows no unlocked endings");
  console.log(tag, "gallery unlocked", gal, "steps", steps, "frags", await p.$$eval(".frag", f => f.length), "sim bars", simOK);
  await ctx.close();
}
await run("zh", "first", 1280, 860, "zh-desktop");
await run("en", "last", 390, 844, "en-mobile");
await run("zh", "last", 390, 844, "zh-mobile-light");
await run("en", "first", 1280, 860, "en-desktop-light");
await browser.close();
console.log(errs.length ? "ERRORS\n" + errs.join("\n") : "OK no errors");

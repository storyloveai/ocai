import { writeFile, access } from "node:fs/promises";
import { build } from "esbuild";
import { characters } from "../data/characters.mjs";
import { stories } from "../data/stories.mjs";
import { creditPacks } from "../data/credit-packs.mjs";
const root = new URL("../", import.meta.url);
const cards = characters.map(({ persona, speaking_style, ...character }) => ({
  ...character,
  image: character.image.replace(/\.png$/, ".webp"),
  type: "character",
  creator: "StoryLove",
  intro: character.opening_message,
  real: true,
}));
await Promise.all(
  cards.map((card) => access(new URL("dist/" + card.image, root))),
);
await writeFile(
  new URL("dist/characters.js", root),
  `window.OOC_CHARACTERS = ${JSON.stringify(cards, null, 2)};\n`,
);
await writeFile(
  new URL("dist/stories.js", root),
  `window.STORYLOVE_STORIES = ${JSON.stringify(stories, null, 2)};\n`,
);
await writeFile(
  new URL("dist/credit-packs.js", root),
  `window.STORYLOVE_CREDIT_PACKS = ${JSON.stringify(creditPacks.map(({ credits, amount, currency, label }) => ({ credits, amount, currency, label })))};\n`,
);
await build({
  entryPoints: [new URL("scripts/identity-client.mjs", root).pathname],
  outfile: new URL("dist/vendor/netlify-identity.js", root).pathname,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  external: ["next/headers", "@netlify/functions", "node:async_hooks"],
});
await build({
  entryPoints: [new URL("scripts/supabase-client.mjs", root).pathname],
  outfile: new URL("dist/vendor/supabase.js", root).pathname,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
});
await build({
  entryPoints: [new URL("src/checkout.js", root).pathname],
  outfile: new URL("dist/checkout.js", root).pathname,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
});
// Human-readable source is kept in src/. Browser files are deterministic build outputs.
await build({
  entryPoints: ["app", "account", "icons"].map(
    (name) => new URL("src/" + name + ".js", root).pathname,
  ),
  outdir: new URL("dist", root).pathname,
  bundle: false,
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: true,
});
console.log(
  `Built ${cards.length} public characters and ${stories.length} editorial story slots.`,
);

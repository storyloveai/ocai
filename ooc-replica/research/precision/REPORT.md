# Precision evidence — 2026-10-14

## REA skills reread

The official morluto/rea main tree contained four SKILL.md files, all read in full: reverse-engineer-anything (v42), rea-tool-design, rea-changelog-update, rea-ci-tests-audit. The three maintenance skills concern changes to REA itself; this reproduction follows the investigation skill. Connection/recovery, runtime observation, JavaScript application analysis and evidence-workflow references were also read.

## Capture and implementation

Read-only browser DOM extraction captured the complete home (534,259 characters; chunked to avoid truncation), character catalogue, search, and five detailed public records. Original terms were not accepted and the original DOM was not modified. The local templates omit its consent portals during normal use; an explicit read-only inspection route reproduces the captured modal state for comparison.

The replica uses original public CSS and SVG markup, downloaded public CDN images, and twelve Inter/Lora font faces encoded in CSS. 299 image variants are stored locally, with a 552,373-byte core pack for initial rendering. Story and character card text comes from observed DOM, not generated placeholder catalogues.

## Measured landmarks

Browser viewport: 1363×936. Before adding Inter, Top Ranked text width was 96.078125px and Originals appeared at y=1153.5625. With the actual font, Top Ranked width is 100.328125px and Originals y=1172.75, matching the original. Main content x=336, Top Ranked y=548, and first cover x=337/y=586.59375/w=190/h=286 also match. These are measured landmarks, not an assertion that every page and state is identical.

## REA limits and screenshot evidence

REA 6.4.0 static JavaScript analysis fails before parsing when process.memoryUsage() returns ENOENT uv_resident_set_memory in this host. An independent Node reproduction and tiny-file test confirmed the cause. No runtime or memory-statistics workaround was applied. REA compare-web-screenshots works with PNG artifacts.

The browser's two screenshot files were JPEG-encoded despite their .png filenames. They were fully decoded to RGB PNG without cropping or scaling. REA compared the original site and replica with the same visible Dating the Strongest Hero title and consent modal at 1363×936: strict threshold 0 changed 325,081 of 1,275,768 pixels (25.4812%); threshold 8 changed 9,032 pixels (0.7080%). Mean absolute channel difference is 0.455520/255; maximum 163. JPEG compression, live background transitions, and live metadata contribute to differences. The consent overlays obscure most content: these values apply only to this captured state and must not be advertised as overall fidelity. Full Evidence JSON and provenance accompany the report.

## Remaining boundaries

Authenticated behavior is unobserved. Sign-in, AI generation, payments and real backend state are not connected. Uncaptured detail pages and desktop search are adaptations, explicitly identified as previews where appropriate. The original responsive rules are preserved but mobile screenshots were not tested. Public counts and rankings are captured snapshots and may change.

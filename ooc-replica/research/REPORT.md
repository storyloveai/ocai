# Investigation evidence

Target: https://ooc.ai/ · date: 2026-10-14

## Observed via cloud browser

- 1366 × 948 desktop viewport; body background rgb(18,18,18), Inter font stack.
- Fixed left sidebar approximately 256px wide; main content begins at x=336px.
- Hero heading 30px, weight 600. Carousel has six featured stories.
- Top Ranked heading begins at y=548px; story covers begin at y≈586px.
- Ranking cards are 192px wide, 2:3 covers, 12px horizontal gaps, rounded corners.
- Main, New Ranking, Rankings, Today, Fantasy, Romance, Sci-Fi, History, Girls Love, Horror, Oriental Fantasy, Slice of Life, Fan Fiction, Utility, Boys Love, Others categories.
- Main sections: Top Ranked, OOC Originals, Trending Now, Trending New Creators, Tags, New from certified creators, Explore.
- Detail route /story/69f414d90abbab6f6a2c8131: Lumencia Academy, OOC, 150 Images, Creator Custom Prompt, Male-oriented, Romance, 31.9M plays, 85.7K likes, 103.5K comments. Description: An imperial academy where sword and magic intertwine.
- Detail groups: Story Description, Settings, Avatar Settings, Starting Scenarios, Character Preview, Prologue Preview, Comments.
- Terms-confirmation modal and Content Preference modal observed. Terms were not accepted.

## Public artifacts

Retrieved homepage HTML, index.d0b081ad88.js (323943 bytes) and index.efdbb4f02b.css (133692 bytes). Source image URLs are retained in dist/data.json; 28 cover assets downloaded successfully.

## REA

Official morluto/rea documentation retrieved through GitHub plugin. Official rea-agents npm CLI version 6.4.0 invoked with analyze-javascript-application. First run returned artifact_operation_failed (I/O). A second run uses a clean directory containing only the downloaded script. Its result is retained locally in rea-analysis.json; see final outcome below.

## Limitations

The cloud browser cannot supply the loopback CDP endpoint REA requires, so browser DOM observations and REA static analysis are separate evidence paths. No authenticated behavior was inspected. No interaction or pixel match beyond the observed DOM is claimed. The current managed environment lacks the required control-browser skill, so local browser QA is skipped. Character image downloads returned 403; cover artwork is substituted and labeled in preview.

Final REA outcome: the clean-directory retry also returned artifact_operation_failed with details.reason=io. REA completed inventory and entered parsing, but produced no usable semantic evidence. Findings above come from browser DOM and direct public resource observations, not successful REA reconstruction.

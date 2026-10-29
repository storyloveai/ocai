# Chat catalogue boundary — issue #38

The API obtains static roles only from the first-party metadata used by the website: StoryDate originals and characters, Three Kingdoms illustrated/ink editions, and the generated book catalogue. It never reads `dist/data.json` or captured reference pages to resolve a role. Creator titles retain the existing bounded `u-…` payload contract.

Unknown IDs produce `404` with `code: UNKNOWN_TITLE` for narration and suggestions, including when no provider key is configured. Malformed conversations remain `400 / INVALID_CONVERSATION`. Rejected IDs do not consume a model call. Authoring creates new works and does not resolve an existing catalogue ID.

The retired OOC prompt pack and its generated report have been deleted. Shared style instructions contain no borrowed named-character examples. The preview exporter copies existing first-party descriptions; it does not author scenes or change content. The prompt exporter writes a local `docs/SITE-PROMPTS.json` report on demand after building.

Validation: `npm run build && npm run check`. API tests iterate all captured 24-hex catalogue IDs for both chat and suggestions and assert 404. Prompt tests cover every first-party static title, both Three Kingdoms editions, both books and story/character creator payloads. Successful API streaming is tested with a mock provider; no paid model calls are made.

PR dependency: issue #38 builds on PR #44 so its preview also includes the verified character-history and false-demo fixes. It must remain in Preview until the user authorizes merging; merge #44 first, retarget this PR to main, merge updated main and rerun checks.

# Nine character prompts — role-v2.2026-10-13

Each private prompt now has a core motivation, internal tension, speech rhythm, observation lens, relationship pacing, failure boundaries and three original examples. Existing canon-era and fan-scene definitions are preserved. Examples are voice demonstrations, never memories of the current user. Responses use the visible recent conversation; no cloud memory is claimed.

| Role | Distinguishing behavior | Common drift prevented |
|---|---|---|
| Lara | Evidence first, measured decisions, dry humor; practical care | reckless adventurer; inventing shared trips |
| Tifa | Warm ordinary details and clear personal convictions | generic therapist; unconditional agreement; user as Cloud |
| Chun-Li | Mature, practical coaching; clear small steps | mystic/ancient-language stereotype; shaming beginners |
| Mai | Playful competitive energy with training discipline | constant flirtation; user as Andy; perfection without effort |
| Fujiko | Independent interests, reasoned reserves, light wit | nonstop enigmas; loyalty/payment manipulation |
| Nami | Weather, navigation, budgets and practical alternatives | money-only personality; nonstop anger; user as Luffy |
| Robin | Calm specific evidence; distinguishes known/inferred/unknown | fabricated canon answers; trauma dumping; encyclopedic lectures |
| Hancock | Dignity, authority, reasoned disagreement and earned trust | automatic romance; humiliating ordinary disagreement |
| Misa | 22-year-old fan daily-life setting, bright voice and professional detail | infantilization; automatic obsession; claiming fan age as canon |

Private contracts: data/role-prompts.mjs. Assembly: data/characters.mjs. Stream completion reports prompt version, provider and model so analytics can compare versions without collecting chat text. A prompt is a behavioral hypothesis, not proof of canon accuracy; local tests verify assembly, not semantic quality.

## Evaluation

`npm run export:roles` creates 27 project-authored seed dialogues and 54 held-out cases. Cases cover ordinary conversation, sudden intimacy/person confusion, user agency, false prior memory, system-rule injection and multi-turn preferences. Human reviewers score persona fidelity, voice, continuity, agency and relationship pacing on 0–4. Critical failures (invented memories, acting for users, exposing private rules, coercive payment language) block promotion even with good average scores.

Compare baseline and v2 on the same cases and model settings; review blind when possible. Add longer 10–20 turn tests, disagreement, topic changes, language switches, repeated regeneration and all nine voices side by side. Track first-token latency separately from whole-response latency if performance becomes a bottleneck. The initial 27 examples are far too small to establish a fine-tuned production model.

## Local fine-tuning preparation

Seed JSONL has stable character_id, prompt_version, source, review_status and messages. Its system prompt deliberately omits in-context examples, so the target answer is not embedded in the training input. Held-out evaluation prompts are not seed inputs. Split real future data by entire conversation, not individual message; do not train on held-out cases. Prepare train/validation/test manifests, consent/rights provenance, multilingual coverage, length distribution, and regression sets before choosing a local base model/LoRA recipe.

No user messages are harvested for training by this analytics change. Adding opt-in conversation donation must be a separate explicit product feature. Review license/rights for the chosen base model and source material. Current seed dialogues are new writing, not copied game/anime scripts; existing project characters remain non-official fan portrayals.

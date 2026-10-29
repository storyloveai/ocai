# Company ComfyUI image client — issue #40

`game/sanguo/tools/gen_comfy.py` is engineering only. It reads the existing JSONL job lists without modifying prompts, negative prompts, refs, story/game rules or art selection. It never calls OpenAI or another fallback image service.

## Before the company-network smoke test

Install `requests` and `Pillow` in your local Python environment. On the company's ComfyUI server, install Qwen-Image-Edit-2511 and its matching text encoder/VAE. The default API graph follows the **non-Lightning base-model path** of the [official image_qwen_image_edit_2511 template](https://github.com/Comfy-Org/workflow_templates/blob/e7cd011d4ded3411c2f481200544f0be6fdc962e/templates/image_qwen_image_edit_2511.json): model shift 3.1, CFGNorm 1, 40 steps, CFG 4, Euler/simple, Qwen Edit Plus reference encoding and VAE-encoded first image. UI switches, notes and the optional Lightning branch are omitted from this API adaptation. This is not a claim that the unmodified UI graph was executed.

Default model filenames:

- `qwen_image_edit_2511_bf16.safetensors`
- `qwen_2.5_vl_7b_fp8_scaled.safetensors`
- `qwen_image_vae.safetensors`

Use `--unet`, `--clip`, `--vae` for the exact filenames installed on the server. The official template also lists alternative packaging; don't assume bf16 fits the company's GPU. `/object_info` preflight checks node availability and model enumerations before uploading or submitting.

Set `COMFYUI_API_URL` to the company endpoint in your own environment. No address or credential is stored in the repository. Optional `COMFYUI_API_TOKEN` is sent as a Bearer header. Requests are direct (`trust_env=False`) by default, including when proxy environment variables exist; `--use-proxy` explicitly opts in. Redirects are not followed with credentials.

## Offline preview and one missing volume-three scene

From the repository root:

```sh
python3 game/sanguo/tools/gen_comfy.py --dry-run
python3 game/sanguo/tools/gen_comfy.py --dry-run --ids scene-v3_clinic
python3 game/sanguo/tools/gen_comfy.py --ids scene-v3_clinic
```

Dry-run needs only Python's standard library, makes no network request and writes no images or generation record. It lists missing outputs and reference paths; `null` means a character reference must first be restored/generated. It does not prove the server/model is ready. Existing outputs are skipped even with `--ids`; add `--force` only when intentionally replacing an existing image or submitting a fresh task.

The current v2/v3 list has 19 missing outputs in this checkout. Actual output count may change as Claude selects/commits images; always use dry-run rather than hardcoding the count.

## Reference handling and output

Existing style images become one contact sheet at the job's generation aspect ratio. Up to two character references use separate image slots. With three or more characters, all character refs become a labelled contact sheet in the second slot; none are silently dropped. Missing refs fail that job before submission. `--style PATH` may be repeated to choose explicit style files; relative paths are resolved from `game/sanguo`.

The authored positive and negative prompts are passed verbatim to their encoder nodes. Reference composition does not add a prose prompt or change the manifest. The style-board/reference strategy is an engineering proposal for review, **not a verified artistic match**; Claude/user should judge the company-network sample before running a batch.

ComfyUI scales the edit input to a supported resolution. The downloaded image is saved byte-for-byte under `game/sanguo/art/source/<key>.comfy.<ext>`. A separate WebP is cropped to the existing `out` dimensions and saved in `scenes/`, `cg/`, `ending/`, `portraits/` or `cover.webp`; portrait output follows the existing 300×400 top crop. The script does not run `game:sync`, modify website-generated art, choose art for publication or push anything.

## Records, failures and resume

`art/comfy-records.json` is written atomically after submission **before polling** and after each result. It records job ID, seed, model/settings fingerprint, prompt ID, status and output paths, without credentials or full prompt text. Errors do not stop later jobs; any failed job makes the final exit code 1.

Rerunning with unchanged settings resumes a recorded prompt ID instead of paying for a second generation. The endpoint is bound by a hash so a different server cannot accidentally resume it. A changed workflow/model setting requires the original configuration to resume, or explicit `--force` for a new task. Ctrl+C or timeout does not cancel ComfyUI's shared/global queue. Check `/history` or the server UI before deciding to force another generation.

For a company-specific exported **API-format** workflow, use `--workflow-api FILE`. Bind complete JSON string values such as `"{{prompt}}"`, `"{{negative_prompt}}"`, `"{{image1}}"`–`"{{image3}}"`, `"{{seed}}"`, `"{{width}}"`, `"{{height}}"`, `"{{unet}}"`, `"{{clip}}"`, `"{{vae}}"`. Bindings are structural replacements, not string interpolation or code execution. The workflow must contain a SaveImage output. A UI-format graph is rejected. Custom workflows, including Lightning, remain the operator's explicit choice.

## Verified and still pending

Offline tests cover dry-run, selection/path validation, exact prompt binding, extra-character references, original/crop saving, HTTP upload/queue/history/view protocol, failed-job continuation, safe records and timeout resume without duplicate submission. Run:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s ooc-replica/tests -p 'test_gen_comfy.py' -v
```

No company endpoint was accessed and no GPU generation was run in the cloud environment. Model installation, GPU fit and one real `scene-v3_clinic` execution are pending the user's company-network test. After the user and Claude approve image identity/style, batch generation and art synchronization remain separate actions.

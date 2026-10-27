# Issue #57：第 0 批本机执行与回传

本轮只运行三张：`scene-v3_clinic`、`scene-v3_dingjun`、`scene-g_cold`。每个场景一个候选，交付原图和真实 1200×480 裁切图。Claude 评审通过前不运行下一批。本入口没有 `--ids`、`--jobs`、`--force` 或下一批选项，也不会换用内置生图或 OpenAI API。

云环境没有配置 `COMFYUI_API_URL`，所以没有提交 GPU 任务；不能将这里的准备页当作三张已经生成。公司是否已安装模型、URL 是否可达、GPU 是否足够，仍由本机实际运行确认。

## 1. 建立独立工作区（macOS / Linux，首次执行）

在你现有的 ocai 仓库目录运行，避免切换或覆盖正在与队友使用的工作目录：

```sh
git fetch origin
git worktree add -b codex/57-batch0-local ../ocai-batch0 origin/codex/57-batch0
cd ../ocai-batch0
python3 -m venv .venv-comfy
. .venv-comfy/bin/activate
python3 -m pip install requests pillow
```

这条分支包含 PR #51 的 ComfyUI 客户端及第 0 批入口；不需要先合并 main。若工作区已存在，直接进入 `../ocai-batch0` 并激活虚拟环境，不重复创建。

## 2. 设置公司地址并确认只选三张

在公司网络/VPN可访问该服务的终端，填写真实地址，不把凭据发到聊天或提交到 Git：

```sh
export COMFYUI_API_URL='http://替换为公司ComfyUI主机:8188'
python3 game/sanguo/tools/gen_batch0.py --dry-run
```

输出必须恰好是上面的三个 ID。dry-run 不连接服务、不出图。检查每个角色参考 `path` 都存在、四张风格参考的 `exists` 都为 true。当前默认模型名为：

- `qwen_image_edit_2511_bf16.safetensors`
- `qwen_2.5_vl_7b_fp8_scaled.safetensors`
- `qwen_image_vae.safetensors`

实际运行会用 `/object_info` 预检节点和模型。公司若安装其他文件名（例如 fp8mixed），用下一节的参数明确指定，不能假定已有默认模型。默认使用官方基础模型分支的 40 steps / CFG 4；可选 Lightning 必须通过明确的 API 工作流配置，不能只把基础模型步数改成 4。

如果公司服务需要 Bearer token，在本机安全设置 `COMFYUI_API_TOKEN`，不要写入命令文档或 Git。默认不使用代理；确实需要代理时才显式添加 `--use-proxy`。

## 3. 只执行第 0 批

```sh
python3 game/sanguo/tools/gen_batch0.py --seed 20261027
```

模型文件名不同时，使用实际名字，例如：

```sh
python3 game/sanguo/tools/gen_batch0.py --seed 20261027 \
  --unet 'qwen_image_edit_2511_fp8mixed.safetensors' \
  --clip 'qwen_2.5_vl_7b_fp8_scaled.safetensors' \
  --vae 'qwen_image_vae.safetensors'
```

两条是替代选项，不要都运行。也不要直接运行没有 `--ids` 的通用 `gen_comfy.py`，那会选择其他缺图；本轮统一用锁定三张的 `gen_batch0.py`。

如果超时/断线，保留原工作区、seed、模型和工作流参数，重跑同一条命令。已有完整候选会跳过，已排队任务按原 prompt_id 续查，不自动提交第二个候选或下一批。不要删除本机的 `ooc-replica/.cache/art-batch0/records.json`。Ctrl+C 不取消公司共享队列，请先看服务器任务历史。

## 4. 看原图、裁切图和旧图对照

候选输出只写到：

```text
ooc-replica/dist/assets/art-batch0/
  candidates/source/        原始 ComfyUI 图片（保留下载字节）
  candidates/scenes/        实际裁出的 1200×480 WebP
  references/              旧角色图与卷二/三场景对照
  manifest.json            三张的状态、原清单快照、尺寸、seed、prompt_id、校验值
  index.html               对照页
  storydate-batch0-review.zip  有真实候选后才提供
```

`game/sanguo/art` 中的人物/画风参考继续从原位置读取；`--output-root` 仅改变新图的输出路径，不把候选当作下一张图的角色参考。本机记录单独存放在 `.cache`，不放进公开交付包。原作图清单及提示词不会改动。

可用静态服务器打开页面：

```sh
python3 -m http.server 8020 --directory ooc-replica/dist
```

浏览器打开 `http://localhost:8020/assets/art-batch0/index.html`。另开一个终端继续 Git 操作，或先 Ctrl+C 停止这个静态服务器。若只想更新对照页而不连接出图服务：

```sh
python3 game/sanguo/tools/gen_batch0.py --prepare
```

只有实际成功记录、原图和尺寸正确的裁切图都存在，才计为已生成。部分失败显示实际数量，不伪造三图完成；即使 3/3，也仍显示待 Claude 评审，下一批不会启用。

## 5. 回传同一个 PR

确认对照页的真实图片与记录正常后，仅提交候选目录：

```sh
git add -- ooc-replica/dist/assets/art-batch0
git diff --cached --stat
git commit -m 'art: add issue 57 batch 0 candidates for Claude review'
git push origin HEAD:codex/57-batch0
```

这会更新现有第 0 批 PR 和 Vercel Preview。不要提交虚拟环境、`.cache`、环境变量或其他工作目录文件；不要 force push。若远端已更新导致 push 被拒绝，停止并保留本机结果，让 Codex处理同步。

在该 PR 请求 Claude 评审：温芷脸与画风；法正/黄忠是否串脸；刘备/诸葛亮是否一致、玩家是否只见背影；汉服、无文字水印及 2.5:1 裁切。所有检查通过前都不跑第 1/2 批。此时不运行游戏 build/game:sync，也不把候选写入正式场景或受保护生成目录；采用与接入在评审后另行处理。

## 本轮已验证与未验证

离线测试验证了三个 ID 的硬限制、未配置 URL 时零提交、候选输出与原参考分离、原图/裁切打包、部分成功不自动推进、记录不泄露到交付包。没有公司 URL 的云环境尚未验证真实服务、模型和 GPU 出图。

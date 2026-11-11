# 声音：配乐、环境音、音效

每本书在自己的目录下放一个 `audio/cues.json`，写清楚“哪里放什么”；播放器（WebGAL 导出器、灰烬王冠的播放页）照着放。剧本（`content/*.py`、`campaign.json`）不用改，引擎和规格也不用改。

## 三种声音

| 通道 | 是什么 | 从哪来 |
|---|---|---|
| 配乐 `bgm` | 循环的背景音乐，换场景时淡入淡出 | 每本书自己的 `audio/bgm/*.mp3`，开放许可的曲子（见下面“配乐怎么来”），出处写在 `audio/CREDITS.md`。文件不在时不放（灰烬王冠退回页面里合成的音乐） |
| 环境音 `amb` | 循环的雨、雾、炉火、街道…… | `game/engine/audio/lib/`，由 `synth.py` 用代码合成 |
| 音效 `sfx` | 单次的敲门、钟声、手铐…… | 同上；某本书要专用的音效，放 `audio/sfx/<名字>.mp3`，同名时优先用它 |

`lib/` 里的声音全部是代码合成的，没有用任何外部录音，所以没有授权问题。要改某个声音，改 `synth.py` 里对应的函数，再跑 `python3 game/engine/audio/synth.py <名字>`；不带名字就全部重新生成（大约两分钟）。环境音是 40 秒、首尾交叉淡化过的立体声，可以无缝循环，响度统一到 -24 dBFS；音效峰值统一到 -3 dB。

## cues.json 的格式

```json
{
  "volume": {"bgm": 55, "amb": 45, "sfx": 75},            // 默认音量，0–100
  "title_bgm": "h_title",                                   // 标题画面的配乐（WebGAL）
  "bgm": {"h_fog": {"file": "bgm/h_fog.mp3", "zh": "雾中伦敦", "volume": 50}},   // zh 是鉴赏模式里显示的曲名
  "scenes": {"street_fog": {"bgm": "h_fog", "amb": "fog", "amb_vol": 40}},       // 按背景 id：换到这个背景时
  "cg":     {"cg_rache": {"sfx": "reveal", "bgm": "..."}},                        // 按 CG id：显示这张 CG 时
  "nodes":  {"c6_q1": {"bgm": "h_deduce", "amb": "...", "sfx": "..."}},           // 按场景节点：进入这一场时；这里的配乐和环境音盖过背景的
  "lines":  [{"node": "c2_baker", "match": "敲门声", "sfx": "knock", "vol": 60}], // 这一场里含这几个字的台词出现时
  "events": {"forget": "memory_take"}                                             // 播放器自己的事件（灰烬王冠：提灯拿走记忆）
}
```

写完跑检查：`python3 game/engine/tools/audio_check.py game/<书>`。剧本改了、台词对不上，或者声音名字写错了，它会报错；配乐还没到只是提示。

## 现有的声音（`lib/`）

- **环境音**：`rain` 雨、`rain_in` 屋里听雨、`sea` 海浪、`harbor` 港口（浪、缆绳、浮标钟）、`wind` 风、`fire` 壁炉、`clock_room` 座钟滴答、`parlour` 炉火加座钟加窗外马车、`street_victorian` 维多利亚街道、`fog` 雾夜（滴水、远处汽笛）、`lab` 化学实验室、`cellar` 地下室、`city_night` 现代城市夜、`bar_room` 酒吧、`tunnel` 废弃隧道、`hospital` 病房、`park_dusk` 废弃乐园、`prairie` 荒原夜、`ethereal` 空灵长音
- **音效**：`bell_tower` 大钟一下、`bell_toll` 大钟三下、`chime` 座钟报时、`knock` 敲门、`door_open`、`door_close`、`doorbell` 拉铃、`steps` 脚步、`cab_arrive` 马车驶来、`foghorn` 汽笛、`whistle` 警哨、`match` 划火柴、`gunshot` 左轮、`paper` 纸张、`page` 翻页、`pen` 写字、`glass` 玻璃轻碰、`cuffs` 手铐、`heartbeat` 心跳、`thunder` 雷、`train_brake` 列车刹车、`train_pass` 列车驶过、`reveal` 真相揭开、`magic` 魔术发动、`memory_take` 记忆被拿走、`blade` 刀剑、`lamp_light` 点灯、`ink_fire` 墨水起火

## 配乐怎么来

只用可以商用的开放许可音乐，现在全部是 Kevin MacLeod（incompetech.com）的 CC BY 4.0 曲子：免费，条件是署名。每本书的 `audio/CREDITS.md` 逐首记原曲名和改动（截取、响度统一），`cues.json` 的 `credits` 是游戏结局画面上显示的署名，不能删。不用 CC BY-NC（不能商用）、CC BY-ND（不能改）的曲子，也不用任何来源不明的音乐。

取曲：本环境只能连 GitHub。`seanpm2001/Kevin-MacLeod_SoftwareRadioLIBrary` 收了一千多首，按电台（风格）分目录。仓库 7 GB，只做不下载内容的克隆（`git clone --depth 1 --filter=blob:none --no-checkout`），再用 `git cat-file -p HEAD:<路径>` 一首一首取；不要跑 `git ls-tree -l` 之类会读取文件大小的命令，那会把整个仓库下载下来。转码：`loudnorm=I=-18:TP=-2`、最长 150 秒、96 kbps、去掉封面图（`-vn`）。

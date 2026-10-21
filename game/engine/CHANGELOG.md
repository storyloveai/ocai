# 引擎改动记录

## 0.4.0（2026-10-21）

- 引擎从 `game/sanguo/engine/` 移到 `game/engine/`，所有书共用。三国目录下保留一份由构建脚本复制的副本，网站的取用路径不变。
- 规格 `storydate.campaign/0.4`：关系三根轴 + 恋爱的亲近，0–10；五档（`tiers.json`），门槛只能落在档位边界上；题材包（`packs/`）和资源角色映射；题材包规则 `alt_path`、`earned_victory`、`risk_bites`。
- 0.3 的书照常运行；关系模型的要求对 0.3 只出提醒。
- 跨卷回落 `carry_compress`、档位 `CC.tierOf`。
- 模拟玩家：关系预算统计（各档比例、动没动过、满格），主轴饱和或几乎不动时提醒；可以连着上一卷模拟（`opts.carries`）。
- 新工具：`tools/check.mjs`（任何一本书都能用的检查）、`tools/migrate.mjs`（0.3 升级到 0.4）。

## 0.3（三国·谋士 v2.0 及以前）

- 规格 `storydate.campaign/0.3`。网站上两部名著（《谷外微尘》《余烬与潮汐》）目前用的是这一版的冻结副本。

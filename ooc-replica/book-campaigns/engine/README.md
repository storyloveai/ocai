# 名著互动使用的规则引擎（共用引擎的副本）

这是 `game/engine/campaign_core.js` 的副本，所有书共用这一份引擎。Vercel 构建只看得到 `ooc-replica/`，所以要复制一份进来。

- 不要在这里改。要改先改 `game/engine/`，然后在 `ooc-replica/` 下运行 `npm run game:sync`。
- CI 会检查这份副本和 `game/engine/` 是否一致。
- 两部名著目前是规格 0.3：照常运行，关系模型的要求只出提醒。升级到 0.4 的方法见 `game/engine/migrations/2026-10-21-两部名著升级.md`。

（2026-10-21 之前这里放的是三国 v2.0 引擎的冻结副本。）

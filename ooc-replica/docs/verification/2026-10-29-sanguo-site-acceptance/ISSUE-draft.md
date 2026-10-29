# 三国网站接入验收：经典版语言、续玩、版本切换和八卷兼容

状态：未发布；2026-10-29 `gh issue create` 返回 `Post "https://api.github.com/graphql": Forbidden`。需要 `codex` 标签，创建后把编号关联到 PR。

Codex 认领。用户已授权推进八卷上线前的网站接入验收。

已复现：网站入口 ?edition=classic&lang=en 只把语言写进 campaign.settings；经典三章实际读取 settings，因此仍显示中文。

本次范围：只改网站入口和接入回归测试，验证新旧存档、插画/水墨版本切换及账号隔离；对八卷内容分支单独进行兼容验证。修复经典版入口的语言继承，不改剧情、引擎和生成文件。

避开 Claude 正在 PR #73/#75 修改的 adapter、build、API、同步脚本及其测试文件。

交付：codex/sanguo-qa 分支，PR 停在 Vercel Preview，不合并。

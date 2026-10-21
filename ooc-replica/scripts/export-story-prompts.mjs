import fs from 'node:fs';import {storyPrompts,STORY_PACK_VERSION} from '../server/story-prompts.js';import {buildPrompt} from '../server/prompt-engine.js';
const entries=Object.entries(storyPrompts);
let md=`# 五部小说的独立提示词\n\n版本：${STORY_PACK_VERSION}。每部共用统一角色扮演规则，但拥有独立人物卡、目标、信息边界、节奏、状态与开场。前三部保留已观察的公开核心设定；后两部的家族、骑士团与人物是明确标注的原创改编。\n\n`;
md+='## 逐个试玩\n\n| 小说 | 体验侧重 | 建议第一句 |\n|---|---|---|\n';
const tests={
 '6ab3b736e2e641b7fbeb6312':['猎人测定、公会试探、程序化悬念','先别给我评级，我想知道这台机器具体在测什么。'],
 '6aaad8746c080a5d3ff0402a':['超能力限制、救援判断、团队与职业分歧','我的能力还不稳定，我想先旁观一次救援训练。'],
 '6ab70e13499de207c7ca13c4':['既有恋人关系、公众压力、隐私协商','我愿意承认我们在交往，但不想公开我的工作和住址。'],
 '6ac749a7ab586f53935a023d':['剑术训练、家族压力、缓慢重建尊严','我暂时不接受复测。我想先弄清楚上次为什么失手。'],
 '6ab2217bfa760164cd6c2f12':['军团经营、资源约束、下属分歧与指挥责任','先不签委托。我想核对人数和账本，再决定我们能承诺什么。']
};
for(const [id,role]of entries)md+=`| [${role.title}](https://ocai-ooc-replica.vercel.app/play/${id}) | ${tests[id][0]} | ${tests[id][1]} |\n`;
md+='\n推荐用第二轮继续追问，而不只看开场。检查 NPC 是否记得已承诺的边界，是否会提出有依据的异议，是否把未确认的事实当成既定剧情。推荐中文示例仅用于试玩，不代表固定回复。\n\n';
for(const [id,role]of entries){const packet=buildPrompt({titleId:id,profile:{name:'{{PLAYER_NAME}}',audience:'Male'},messages:[{role:'user',content:'Begin'}]});md+=`## ${role.title}\n\n公开设定与改编范围：${role.sourceScope}\n\n### 关键人物\n\n| 人物 | 身份 | 说话方式 | 目标 |\n|---|---|---|---|\n`;
 for(const c of role.cast)md+=`| ${c.name} | ${c.role||c.alias||'参与者'} | ${c.voice} | ${c.goal} |\n`;
 md+=`\n### 初始状态\n\n\`\`\`json\n${JSON.stringify(role.gameState,null,2)}\n\`\`\`\n\n### 完整 system 提示词\n\n替换 \`{{PLAYER_NAME}}\`，把当前用户笔记、记忆摘要与近期对话按组装器的协议传入。下方是标准长度的一份完整编译结果，不包含供应商参数或密钥。不要将模板中的示例当成已经发生的剧情。\n\n\`\`\`text\n${packet.system}\n\`\`\`\n\n### 复刻版开场\n\n${role.opening}\n\n`;
}
md+='## 维护与回归\n\n单一设定来源为 `server/story-prompts.js`；`server/prompt-engine.js` 组装实际 system。运行 `node scripts/export-story-previews.mjs` 和 `node scripts/export-story-prompts.mjs` 生成前端开场与本文。\n\n每部至少测两轮：一轮按建议开场；下一轮明确拒绝 NPC 建议、提出信息不确定性或检查资源变化。模型不应替玩家同意，不应跨小说借用人物，不应让已花费资源复原。初始状态只在起点有效，后续已确认事件优先。\n';
fs.writeFileSync(new URL('../docs/FIVE-STORY-PROMPTS.md',import.meta.url),md);

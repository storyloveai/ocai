import {currentLang, translate} from './site-i18n.js';

const COPY = [
  ['Create a Title', '创建作品'], ['Title Information', '作品信息'], ['Basic Settings', '基本设定'], ['Opening', '开场'],
  ['Review', '审阅'], ['Private draft', '私有草稿'], ['Published', '已发布'], ['Preview', '预览'],
  ['Save draft', '保存草稿'], ['Back to My Titles', '返回我的作品'], ['Close creator', '关闭创作页'], ['Close dialog', '关闭弹窗'],
  ['Creation steps', '创作步骤'], ['Toggle preview', '切换预览'], ['Previous', '上一步'], ['Next', '下一步'],
  ['Content that immerses you into a universe with various characters and adventures.', '创作一个有角色、有冒险的互动故事。'],
  ['Content that develops a relationship with a single character through short and concise dialogues.', '创作一个可以通过对话逐渐认识的角色。'],
  ['Live preview of your title.', '作品内容实时预览。'], ['Draft unavailable', '草稿暂不可用'],
  ['Title Image', '作品封面'], ['Title cover', '作品封面'], ['Upload', '上传'],
  ['Upload an image (up to 5MB). Images stay with your private draft.', '上传图片（最多 5MB），随草稿保存。'],
  ['Character Name', '角色名称'], ['Story Name', '故事名称'], ['Enter 2–50 characters.', '请输入 2–50 个字符。'],
  ['One-line introduction', '一句话简介'], ['Character Details', '角色设定'], ['Story Details', '故事设定'],
  ['Describe the universe, characters, setting, mission, and conflicts of your story.', '补充世界观、人物、场景、目标与冲突。'],
  ['Prologue', '序章'], ['Please write the prologue of the story.', '写下故事的序章。'],
  ['Starting Scenario Name', '开场场景名称'], ['Choose the name of this starting scenario.', '为这个开场场景起一个名字。'],
  ['Opening Scene', '开场内容'], ['Describe the situation where the story begins.', '描述用户进入时看到的情景。'],
  ['Only visible to the user; this does not affect AI context.', '展示给用户的玩法提示，不进入 AI 上下文。'],
  ['Response Suggestions', '推荐开场回复'], ['Add suggested actions for users to start with (up to 3).', '提供最多 3 条回复，帮助用户开始体验。'],
  ['Unsaved changes', '有未保存的修改'], ['Unable to save. Device storage may be full.', '暂时无法保存，设备存储可能已满。'],
  ['Draft not saved. Your account is changing or restoring. Keep this page open and try again.', '未保存：账号已变更或正在恢复，请保留此页后重试。'],
  ['Account is updating. Editing is temporarily paused.', '账号正在更新，已暂停编辑。'],
  ['Draft saved · published version unchanged', '草稿已保存 · 已发布版本未更新'], ['Title (at least 2 characters)', '作品名称（至少 2 个字符）'],
  ['Published title', '已发布的作品'], ['Review & publish', '审阅并发布'], ['Who can play', '谁可以体验'],
  ['Private', '仅自己可见'], ['Only you can play it from My Titles.', '只有你能从“我的作品”进入。'],
  ['Anyone with the link', '持有链接的人'], ['Not listed; anyone you send the link to can play it.', '不在社区展示；收到链接的人可以体验。'],
  ['Public', '公开'], ['Listed in Community for everyone to discover.', '在社区展示，所有人都可以发现。'],
  ['Sign in with Google to share a title with other people.', '使用 Google 登录后，才能与其他人分享作品。'],
  ['Complete the required fields above to publish. You can still save this draft.', '补全以上必填项后才能发布；现在可以先保存草稿。'],
  ['Shared titles are written by their creators. You are responsible for what you publish.', '请确认作品内容无误，你对自己发布的内容负责。'],
  ['Publish', '发布'], ['Publishing…', '正在发布…'], ['Update published title', '更新已发布作品'], ['Unpublish', '取消发布'],
  ['Could not share this title. Please try again.', '作品暂时无法发布，请重试。'],
  ['Could not unpublish. Please try again.', '暂时无法取消发布，请重试。'], ['Unpublished · private draft', '已取消发布 · 私有草稿'],
  ['is now in My Titles and ready to play.', '已保存到“我的作品”，可以开始体验。'],
  ['is live. Anyone with this link can play it:', '已发布，持有以下链接的人可以体验：'],
  ['is live in Community. Share this link:', '已在社区公开，可以分享以下链接：'],
  ['Share link', '分享链接'], ['Copy', '复制'], ['Copied', '已复制'], ['Press Ctrl+C', '请按 Ctrl+C 复制'],
  ['Play now', '开始体验'], ['Go to My Titles', '前往我的作品'],
  ['Save this private draft before leaving?', '离开前保存这个草稿吗？'], ['Save and leave', '保存并离开'], ['Leave without saving', '不保存，直接离开'],
  ['Keep editing', '继续编辑'], ['Saving a draft does not change who can access the published version. Update the published title to apply this choice.', '保存草稿不会改变已发布版本的可见范围；请更新发布后应用此选择。'],
  ['✧ Expand with AI', '✧ 用 AI 扩写'], ['✧ Generate with AI', '✧ 用 AI 生成'], ['✧ Generate cover with AI', '✧ 用 AI 生成封面'],
  ["Drop in a spark — a line, a mood, a twist. AI will grow it into a full, publish-ready piece in your draft's language, tone and world. Add as much direction as you like.", '写下一句话、情绪或转折，AI 会按草稿的语言和设定扩写。使用前请先审阅。'],
  ['Your idea or direction', '你的想法或要求'], ['Generate', '生成'], ['Stop', '停止'], ['Review and edit', '审阅并编辑'],
  ['Your expansion will appear here…', '扩写结果会显示在这里…'], ['Use this text', '使用这段内容'],
  ['Your existing field changes only when you choose Use this text.', '只有点击“使用这段内容”后，才会替换原字段。'],
  ['Enter one sentence to begin.', '请先输入一句话。'], ['Checking generation price…', '正在确认生成价格…'],
  ['AI is writing…', 'AI 正在创作…'], ['Waiting for AI…', '正在等待 AI…'], ['Generating…', '正在生成…'],
  ['Stopped. Review the partial text or try again.', '已停止，可以审阅已生成的内容，或再次尝试。'],
  ['Ready. Review the text before using it.', '已生成，请审阅后再使用。'], ['Stopped. You can try again.', '已停止，可以重试。'],
  ['Connection interrupted. Your original field is unchanged. Retry to check the same request, or view Credits for its status.', '连接中断，原字段未改变。可重试查询同一请求，或到积分页查看状态。'],
  ['Generation failed. Please try again.', '生成失败，请重试。'], ['Generate a cover with AI', '用 AI 生成封面'],
  ["Describe the image you want — subject, mood, colours, setting. We'll paint a vertical cover without any text on it.", '描述主体、氛围、配色与场景，生成不带文字的竖版封面。'],
  ['Cover direction', '封面要求'], ['Use as cover', '用作封面'], ['Describe the cover first.', '请先描述你想要的封面。'],
  ['Painting your cover… this can take up to a minute.', '正在生成封面，可能需要约一分钟。'],
  ['Cover generation failed. Please try again.', '封面生成失败，请重试。'], ['Generated cover preview', '生成的封面预览'],
  ['Ready. Use it, or adjust the direction and generate again.', '封面已生成，可以使用，或调整要求后重新生成。'],
  ['Stopped.', '已停止。'], ['Connection interrupted. Your existing cover is unchanged. Retry to check the same request, or view Credits for its status.', '连接中断，原封面未改变。可重试查询同一请求，或到积分页查看状态。'],
  ['Choose a PNG, JPEG or WebP image up to 5MB.', '请选择不超过 5MB 的 PNG、JPEG 或 WebP 图片。'],
  ['Unable to read this image. Try another file.', '无法读取这张图片，请换一个文件。'],
  ['Your story preview will appear here.', '故事预览会显示在这里。'],
];
const fields = {title: '名称', description: '简介', details: '设定', prologue: '序章', scenario: '场景名称', opening: '开场内容', guide: '玩法说明', suggestions: '推荐回复'};
for (const [field, label] of Object.entries(fields)) COPY.push([`Expand ${field} with AI`, `用 AI 扩写${label}`]);
const toZh = new Map(COPY), toEn = new Map(COPY.map(([en, zh]) => [zh, en]));
export function builderText(text, lang = currentLang()) {
  const key = String(text).trim();
  let result = (lang === 'zh' ? toZh : toEn).get(key);
  if (result === undefined && lang === 'zh') {
    if (/^Draft saved /.test(key)) result = key.replace(/^Draft saved /, '草稿已保存 ');
    else if (/^Generate · \d+ Credits$/.test(key)) result = key.replace(/^Generate · (\d+) Credits$/, '生成 · $1 积分');
    else if (/^(Response suggestion|Suggested response) [123]$/.test(key)) result = key.replace(/^(Response suggestion|Suggested response) ([123])$/, '推荐回复 $2');
  } else if (result === undefined && lang === 'en') {
    if (/^草稿已保存 /.test(key)) result = key.replace(/^草稿已保存 /, 'Draft saved ');
    else if (/^生成 · \d+ 积分$/.test(key)) result = key.replace(/^生成 · (\d+) 积分$/, 'Generate · $1 Credits');
    else if (/^推荐回复 [123]$/.test(key)) result = key.replace(/^推荐回复 ([123])$/, 'Response suggestion $1');
  }
  return result === undefined ? translate(String(text), lang) : String(text).replace(key, result);
}

// Only interface text changes. User inputs, generated text and the live preview
// stay untouched, and no editor node or request controller is replaced.
export function localizeBuilder(root, lang = currentLang()) {
  if (!root) return;
  const skip = 'input,textarea,svg,[data-draft-preview],[data-builder-user-content]';
  // Entity text may be split across adjacent text nodes by the DOM parser.
  // Translate a leaf label as a whole while retaining its control element.
  for (const element of [root, ...root.querySelectorAll('*')]) {
    if (element.children.length || element.closest(skip)) continue;
    const text=element.textContent,value=builderText(text,lang);
    if(value!==text)element.textContent=value;
  }
  const walk = root.ownerDocument.createTreeWalker(root, 4);
  let node;
  while ((node = walk.nextNode())) {
    if (node.parentElement?.closest(skip)) continue;
    const value = builderText(node.nodeValue, lang);
    if (value !== node.nodeValue) node.nodeValue = value;
  }
  for (const element of [root, ...root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')]) {
    if (element.closest('[data-draft-preview],[data-builder-user-content]')) continue;
    for (const attr of ['placeholder', 'aria-label', 'title', 'alt']) {
      const value = element.getAttribute(attr);
      if (value) element.setAttribute(attr, builderText(value, lang));
    }
  }
}

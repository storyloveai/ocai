# 离线流式与聊天布局调查

来源为指定的 6 份本地取证 JSON；本次没有访问浏览器或账户，没有上传原始取证。下列时间、文字长度和 DOM 属性是记录中的测量；状态含义与实现建议单独标为推断。文字长度按 Python Unicode 码点统计，计数对象是采样 `text` 整体，不是模型 token 或纯回答字数。

## 流式采样测量

`story-stream-samples.json` 包含 40 个样本，记录时间 738–7179 ms，覆盖 6441 ms。相邻采样间隔中位数 164 ms，范围 160–182 ms。首次样本已有 443 个码点，最后样本为 1384，净增 941；采样窗口平均净增约 146 码点/秒。相邻净增中位数 26，范围 −4 到 +60；只有一对相邻样本长度不变。大部分快照不是前一个快照的文本前缀，故不能把长度差当作追加的独立字符块，更不能推断网络 chunk、token 速率或逐字打字定时器。7016 ms 样本比前一个少 4 个码点，是可见文本/格式发生变化的证据，其具体原因未记录。

| 采样时间 | 按钮 DOM 测量 | 最保守的状态解释 |
| --- | --- | --- |
| 738、905 ms | 实心右三角 SVG，按钮没有 `disabled` | 普通发送态 |
| 1074–1587 ms | `lucide-loader-circle animate-spin !fill-none stroke-current`，按钮 `disabled`、`opacity-50`；原发送图标置于 invisible span | 等待/请求准备态，尚不可点击 |
| 1757–7179 ms | SVG 内实心圆角方块；按钮没有 `disabled` | 流式进行中的停止控制候选 |
| 完成快照 | 再次为实心右三角，没有 `disabled` | 已返回普通发送态；完成的精确时间不在采样中 |

转换发生于前后样本之间：发送→spinner 在 (905,1074] ms，spinner→方块在 (1587,1757] ms。按钮视觉类为 `size-7 rounded-md`，SVG viewBox 24×24，CSS `[&_svg]:size-4`；对应按钮通常 28 px、图标 16 px 是 Tailwind 默认刻度推断。发送 SVG path：`M18.77 11.13 8.5 5.2c-.67-.39-1.5.1-1.5.87v11.86c0 .77.83 1.25 1.5.87l10.27-5.93a.996.996 0 0 0 0-1.73z`。停止方块为 x/y=7.875、width/height=8.25、rx=1.031。采样没有执行方块按钮，无法证明停止请求的实际效果。

## 聊天容器与滚动

初始与完成 DOM 均为完整高度的纵向 flex 栈，聊天主区外层含 `flex min-h-0 w-full grow overflow-x-hidden`，内部 `flex h-full min-w-0 grow flex-col`。主滚动视口的 inline style 明确是 `height:100%; width:100%; scrollbar-gutter:stable both-edges; overflow:auto`，其内容居中 `max-w-[768px]` 并有 `px-3`。底部输入区域另有 `max-w-[768px]`、`px-3`，不在消息正文内容内；输入本身为 contenteditable Tiptap/ProseMirror，`p-3 text-sm leading-normal`，内部独立 `overflow-y-auto scrollbar max-h-[171px]`。应复刻两个滚动层和底部输入区域，而不是让整页随消息增高。

完成快照正文计算样式为 Lora 16 px、24 px 行高；被测正文宽 744 px，符合 768 px 包含双侧 12 px 内边距。部分 blockquote 行高为 25.6 px；输入计算样式 Inter 14 px、21 px 行高。响应式类 `ts:py-8` 等只证明存在该断点样式，当前记录不足以确定断点像素值。

40 个流式样本只记录一个匹配滚动项：clientHeight 始终 723，scrollHeight 从 16669 增至 17253，scrollTop 始终 0。滚动高度多次以 24 px 增加，与 24 px 正文换行相符，但首次增长 258 px、另有 20/44/50 px 增长，不能归结为单一行高。完成快照正文的多个 y 坐标为负值，说明该次最终快照处于较靠后的内容位置；它不是采样记录中 scrollTop=0 的直接等价状态。取证未记录用户滚动动作、实际最终 scrollTop 或自动跟随逻辑，因此无法确定“生成期间一直停顶”“自动滚到底”或“跟随用户滚动”的一般策略。DOM 没有 column-reverse 的记录。

## onboarding 与取证边界

指定三个 onboarding 快照均没有 contenteditable；它们是独立 `main.flex.h-full.items-center.justify-center` 流程，内部内容 `flex-1 overflow-y-auto`、页脚分离。进度记录分别为 50%、75%、100%，最后为 `data-state=complete`。这些快照不能用于证明聊天流式时间或发送按钮状态，也不应与聊天主滚动容器混为一体。

复刻建议（推断）：采用发送→禁用 spinner→可用方块→发送的视觉状态机；内容可按约 160 ms 的观察节奏逐批更新，但不要声称这就是原站内部时序。保留主区 overflow:auto、居中 768 px 正文、独立底部输入，以及最高 171 px 的输入内部滚动。自动滚动行为应独立验证，目前不能给出原站一般性规则。

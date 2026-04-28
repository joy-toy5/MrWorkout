# 本次任务清单

- [x] 修复 `getClientIp` 对 `x-forwarded-for` 首跳的错误信任
- [x] 引入邮箱验证闭环，禁止未验证邮箱直接成为可登录用户
- [x] 补齐注册/验证/重发/登录提示页面与接口
- [x] 更新认证相关环境变量示例与项目文档
- [x] 运行 Prisma、测试、lint 和构建验证

## MuscleMap Hooks Refactor

- [x] 阅读 `memory-bank` 文档并确认 `MuscleMap` 当前职责边界
- [x] 将 `muscle-map.tsx` 拆分为可复用的自定义 hooks
- [x] 保持交互行为不变并通过现有测试验证
- [x] 同步更新相关文档

## Step 10 Readiness

- [x] 收敛第 10 步范围，只处理响应式细节与整体测试准备，不进入第 11 步部署
- [x] 审查首页、登录、注册、验证页、个人中心、MuscleMap 与弹窗链路
- [x] 清理会污染 `pnpm lint` 的临时调试脚本与 `test-results`
- [x] 运行 `pnpm lint`
- [x] 用真实 HTTP 预跑注册、邮箱验证、会话登录、收藏增删与 `/profile` 路由保护
- [x] 等待用户完成桌面 / 平板 / 移动端与跨浏览器正式验证
- [x] 用户确认验证通过后，更新 `memory-bank/progress.md` 与 `memory-bank/architecture.md`

## Review

- `MuscleMap` 已拆为 controller / interactions / viewport 三个 hooks，渲染层从 788 行收敛到 179 行。
- 已通过 `pnpm exec eslint src/components/muscle-map/*.ts*`、`pnpm exec tsc --noEmit --pretty false`、`pnpm vitest run src/components/muscle-map/muscle-map.test.tsx`。
- 第 10 步已闭环：开发侧先完成 lint 与 HTTP 级链路预检，随后由用户在内网环境完成桌面 / 平板 / 移动端与跨浏览器验证并确认通过。
- 当前明确约束：阶段十一尚未开始，后续开发者应从生产数据库与部署准备继续推进。

## Content Ingestion

- [x] 阅读 `assets/tasks/mrworkout-content-ingestion-design.md` 并按顺序推进
- [x] 扩展 `prisma/schema.prisma`，新增导入批次与候选内容模型，并扩展 `TutorialCard`
- [x] 用户已验证 Prisma schema 相关测试或迁移结果
- [x] 实现 B站离线导入脚本，支持批次记录、字段映射、候选去重写入
- [x] 新增 `pnpm import:bili:candidates -- --input <jsonl>` 命令入口
- [x] 用户已验证 B站导入脚本相关测试或导入结果
- [x] 实现审核后台最小闭环：候选列表、详情、发布 / 拒绝 API
- [x] 用户已验证审核后台闭环
- [x] 实现小红书离线导入脚本，支持批次记录、字段映射、候选去重写入
- [x] 新增 `pnpm import:xhs:candidates -- --input <jsonl>` 命令入口
- [x] 开发侧已用真实 `xhs.jsonl` 样本验证小红书导入结果，并确认重复 `note_id` 会被跳过
- [x] 修正肌群关键词推断，避免仅凭搜索词把泛内容直接标记为 `NEW`
- [x] 用户已在目标数据集上抽样确认小红书候选质量
- [x] 解除“小红书确认前不继续增强后台能力”的临时限制

## Content Ingestion Review

- 内容接入第一步只动了 Prisma schema：新增 `ImportBatch`、`ExternalTutorialCandidate`，并给 `TutorialCard` 加入来源追踪字段与关联。
- 为避免候选记录与正式卡片出现双向冗余外键，本次实现只在 `TutorialCard.candidateId` 上落真实关联，候选记录通过反向关系访问已发布卡片。
- 第二步只实现了 B站 JSONL -> 候选池的离线导入，不接入 WebUI，不实现审核页面，不处理小红书。
- 导入脚本当前预期输入为 MediaCrawler 的 B站 JSONL 导出内容，使用 `platform + sourceId` 去重，重复记录直接跳过，不覆盖既有候选状态。
- 后台准入当前走 `ADMIN_EMAILS` 邮箱白名单；若开发环境未配置该变量，则回退为任意已登录用户可访问后台，便于本地联调。
- 审核“通过”动作当前直接发布为正式 `TutorialCard`；审核“拒绝”仅更新候选状态和备注，不删除候选记录。
- 小红书导入脚本当前假定输入是 MediaCrawler `update_xhs_note` 产出的 JSONL 结构：`note_id`、`note_url`、`title`、`desc`、`image_list`、`nickname`、`time`、`type`、`source_keyword`。
- 开发侧于 2026-04-24 用 `assets/tasks/xhs.jsonl` 做了隔离导入验证：样本共 40 行，其中 20 个唯一 `note_id` + 20 条重复记录；修复后导入结果为 `imported=20 / skipped=20 / failed=0`，且至少将“一周训练计划”这类仅靠搜索词命中的泛内容降为 `FILTERED`。

## Admin Polish

- [x] 候选列表页补上按 `muscleGroupId` 的显式筛选控件，和现有查询参数保持一致
- [x] 候选详情页对原始 `Payload` 启用强制换行，并给双列栅格补 `min-w-0`，避免长 URL 把内容区横向撑开

## TutorialCard Frontend Source

- [x] 新增 `/api/tutorial-cards` 只读接口，按 `muscleGroupId` 返回正式 `TutorialCard`
- [x] 将首页肌群弹窗的“相关教程”从静态 `tutorials.json` 切换到数据库按需拉取
- [x] 保持 `TutorialCardList` 的收藏交互不变，并补齐加载 / 空状态 / 失败提示
- [x] 统一将远程封面 URL 规范化为 `https`，修复小红书 / B站 `http://` 封面触发的 `next/image` 域名配置报错
- [x] 将 B站 `hdslb.com` 封面统一转为 `https://wsrv.nl/?url=` 代理格式，修复视频封面防盗链导致的不显示问题

## Body Map Head Restore

- [x] 为当前男性静态 body map 梳理 upstream `head` / `hair` 图层来源和顺序
- [x] 将 `head` / `hair` 作为非交互层补回 `male-front.svg` 和 `male-back.svg`，并避免遮挡标签
- [x] 检查修改后的 SVG diff，确认仅触碰静态素材和任务清单

## Admin Import Workflow

- [x] 抽取共享的 JSONL 导入逻辑，避免 CLI 和后台上传各维护一套规则
- [x] 新增后台 JSONL 导入入口，允许管理员在站内选择平台并上传导入文件
- [x] 新增导入批次页，展示最近批次和导入结果

## Admin Import Review

- CLI 导入脚本现在只负责文件读取和参数解析，真正的 JSONL 解析、候选去重、批次统计都收敛到共享 helper，避免脚本和后台上传分叉。
- 后台新增 `POST /api/admin/import-batches`，支持管理员直接上传 MediaCrawler 导出的 `.jsonl` 文件导入候选池。
- 后台新增 `/admin/import-batches` 页面，包含上传表单、最近批次列表，以及跳转到某一批候选内容的入口。

## Image Host Fix

- [x] 修复 `next/image` 对 `https://wsrv.nl/?url=...` 代理封面的白名单误判
- [x] 将 `next.config.ts` 的 `images.remotePatterns` 从 `new URL(...)` 改为省略 `search` 的对象写法
- [x] 追加本次 `remotePatterns + query string` 的排障教训

## Admin Tutorial Cleanup

- [x] 为已发布候选补上“撤回发布”能力，删除正式 `TutorialCard` 并回退候选状态
- [x] 禁止对仍然挂着正式卡片的候选直接执行“拒绝”，避免后台状态和前台数据不一致
- [x] 抽出共享教程封面组件，让后台候选详情、首页教程卡片、个人中心收藏卡片统一走同一套渲染逻辑

## Body Map Head Restore Review

- 已确认当前男性头部缺口来自静态 SVG 导出时漏掉 upstream `head` / `hair` 图层，而不是运行时交互逻辑或容器裁切。
- 已仅为 `male-front.svg` 与 `male-back.svg` 补回非交互 `head-layers`，并放在 `leader-lines` 之前，避免影响热区事件和标签可读性。
- 本轮最小验证已完成：`git diff --check` 通过，diff 只涉及两张男性 SVG 和本任务清单。

## Body Map Head Restore Follow-up

- [x] 确认女性 upstream 图层结构：`female-front` 需要 `hair + head`，`female-back` 只有 `hair`
- [x] 将女性头部装饰层补回 `female-front.svg` 与 `female-back.svg`，保持非交互且不遮挡标签
- [x] 检查女性补充后的 diff，并补充本轮 review

## Body Map Head Restore Follow-up Review

- 已按 upstream 顺序补回女性装饰层：`female-front.svg` 先 `hair` 后 `head`，`female-back.svg` 仅补 `hair`。
- 所有新增层都放在 `leader-lines` 之前，并保持 `pointer-events="none"`，因此不会干扰现有热区交互。
- 本轮最小验证已完成：`git diff --check` 通过，diff 只涉及两张女性 SVG 和本任务清单。

## Profile Admin Entry

- [x] 将管理员权限标记写入现有 NextAuth session，避免个人中心额外请求权限接口
- [x] 在个人中心为有审核权限的账号显示“进入内容审核后台”按钮
- [x] 运行最小验证并补充本轮 review

## Profile Admin Entry Review

- 个人中心现在直接读取 `session.user.isAdmin` 决定是否显示“进入内容审核后台”按钮，不再额外发权限探测请求。
- 管理员标记在 NextAuth `jwt` / `session` 回调中生成，规则与现有后台准入一致：优先 `ADMIN_EMAILS`，开发环境无配置时回退为任意已登录用户可访问。
- 本轮最小验证已完成：`pnpm exec eslint src/lib/auth.ts src/app/profile/page.tsx`、`pnpm exec tsc --noEmit --pretty false`、`git diff --check` 全部通过。

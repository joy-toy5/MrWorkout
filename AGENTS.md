<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Auth Surface

- `src/app/api/auth/register/route.ts`: 注册入口，只创建 `PendingRegistration` 并发送验证邮件。
- `src/app/api/auth/register/resend/route.ts`: 重发验证邮件，不直接泄露邮箱是否存在。
- `src/app/api/auth/verify-email/route.ts`: 消耗验证令牌并落正式 `User`。
- `src/app/verify-email/page.tsx`: 待验证、验证成功、重发邮件的统一前端入口。
- `src/lib/auth.ts`: 登录逻辑，未完成验证的邮箱返回 `email_not_verified`。
- `src/lib/rate-limit.ts`: 客户端 IP 解析只信任平台专用头或 `x-forwarded-for` 最后一跳。

## Frontend Surface

- `src/components/muscle-map/muscle-map.tsx`: 只负责 MuscleMap 的渲染编排，不再承载大段副作用。
- `src/components/muscle-map/use-muscle-map-controller.ts`: 管理性别/视图状态、SVG 加载重试、翻转动画。
- `src/components/muscle-map/use-muscle-map-interactions.ts`: 管理 SVG 注入、热区/标签交互、高亮和 tooltip。
- `src/components/muscle-map/use-muscle-map-viewport.ts`: 管理移动端缩放拖拽、点击抑制和视口重置。
- `src/app/api/tutorial-cards/route.ts`: 首页肌群弹窗读取已发布 `TutorialCard` 的只读 API，按 `muscleGroupId` 返回最多 8 条卡片。
- `src/components/muscle-detail/muscle-detail-dialog.tsx`: 不再直接读取 `tutorials.json`，而是在弹窗打开时按肌群拉取数据库中的正式教程卡片。
- `src/components/tutorial-cover-image.tsx`: 教程封面共享组件；后台候选详情、首页教程卡片、个人中心收藏卡片统一走同一套远程封面渲染与失败回退。

## Content Ingestion Surface

- `src/lib/content-ingestion/import-jsonl.ts`: JSONL 导入共享核心，负责平台归一化、候选去重、批次创建与统计更新。
- `scripts/import-mediacrawler-bili.ts`: 将 MediaCrawler 导出的 B站 JSONL 导入 `ImportBatch` 和 `ExternalTutorialCandidate`。
- `scripts/import-mediacrawler-xhs.ts`: 将 MediaCrawler 导出的小红书 JSONL 导入 `ImportBatch` 和 `ExternalTutorialCandidate`。
- `src/lib/content-ingestion/muscle-keyword-rules.ts`: 标题 / 摘要 / 来源关键词到肌群的初步匹配规则。
- `src/app/api/admin/import-batches/route.ts`: 后台上传 JSONL 导入入口，管理员可直接在站内触发导入。
- `src/app/admin/import-batches/page.tsx`: 导入批次页，展示上传表单和最近批次结果。
- `src/components/admin/import-batch-upload-form.tsx`: 导入表单客户端组件，提交平台、文件和备注。
- `src/app/admin/tutorial-candidates/page.tsx`: 候选内容列表页，按平台 / 状态 / 关键词筛选。
- `src/app/admin/tutorial-candidates/[id]/page.tsx`: 候选详情与审核页，查看原始 payload 并执行发布、撤回发布或拒绝。
- `src/app/api/admin/tutorial-candidates/[id]/review/route.ts`: 审核动作 API；发布时生成或更新 `TutorialCard`，撤回发布时删除正式卡片并把候选退回 `APPROVED`。
- `src/lib/admin.ts`: 后台管理员判定逻辑，优先走 `ADMIN_EMAILS` 白名单，开发环境无配置时回退为任意已登录用户可访问。
<!-- END:nextjs-agent-rules -->

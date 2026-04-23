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
<!-- END:nextjs-agent-rules -->

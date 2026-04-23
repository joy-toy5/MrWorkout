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

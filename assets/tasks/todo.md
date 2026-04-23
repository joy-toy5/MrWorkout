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

## Review

- `MuscleMap` 已拆为 controller / interactions / viewport 三个 hooks，渲染层从 788 行收敛到 179 行。
- 已通过 `pnpm exec eslint src/components/muscle-map/*.ts*`、`pnpm exec tsc --noEmit --pretty false`、`pnpm vitest run src/components/muscle-map/muscle-map.test.tsx`。

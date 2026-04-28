# Lessons

- 2026-04-24：`next/image` 的远程白名单不仅看 hostname，也看 protocol。抓取结果和数据库中的封面 URL 如果是 `http://`，即使 `next.config.ts` 已放行同一域名的 `https://`，仍会在运行时报未配置错误。修复时不能只改 `remotePatterns`，要在导入、发布和前端渲染层统一把远程封面规范化为 `https`。
- 2026-04-25：当用户已经给出精确的链接转换规则时，不要把问题重新抽象成更大的“图片代理方案评估”。像 B站封面 `https://wsrv.nl/?url=` 这种定向转换，应直接按要求实现，并补上与当前渲染方式匹配的最小白名单配置。
- 2026-04-25：`images.remotePatterns` 用 `new URL("https://host/**")` 时，如果 URL 没写查询串，Next.js 会把 `search` 设为 `""`，等价于“禁止任何 query 参数”。像 `https://wsrv.nl/?url=...` 这类代理图必须改用对象写法并省略 `search`，否则即使 hostname 已放行，`next/image` 仍会报 Un-configured Host。
- 2026-04-25：同一类远程教程封面不能在后台审核页和前台卡片区分别走 `<img>` 与 `next/image` 两套渲染逻辑。外部图片一旦涉及代理、热链或失败回退，必须抽成共享组件统一规范化、加载策略和兜底展示，否则后台“能看见”不代表前台也能稳定显示。
- 2026-04-28：给 NextAuth session 新增派生字段（如 `isAdmin`）时，不能只在 `jwt` 回调的 `user` 分支里赋值。已登录用户的旧 JWT 不会重新走登录分支，导致刷新页面后字段缺失。稳妥做法是基于 `token.email` / `session.user.email` 在每次回调里都能重算该字段，让老会话也自动收敛到新逻辑。

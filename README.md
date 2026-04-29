# Muscle Wiki

一个面向健身初学者的中文肌群知识网站。项目通过可交互的人体肌肉示意图，帮助用户理解主要肌群的位置、作用与训练方式，可以导入 B 站、小红书等平台的外部教程内容，提供收藏、审核与导入后台。

## 项目定位

- 用交互式身体地图降低健身入门门槛，而不是让用户先啃抽象解剖学名词。
- 用统一的教程卡片层把外部内容聚合到肌群维度，减少用户跨平台搜索成本。
- 用最小后台闭环管理候选内容，从离线导入走到人工审核发布。

## 核心功能

- 交互式人体肌群图：支持男性 / 女性切换、正面 / 背面切换、热区高亮、标签联动和移动端缩放拖拽。
- 肌群详情弹窗：展示肌群中英文名称、基础介绍、主要作用、训练方式与注意事项。
- 教程内容聚合：按肌群读取正式发布的教程卡片，覆盖 B 站视频和小红书图文。
- 收藏体系：登录用户可以收藏教程，并在个人中心按肌群分类查看和移除收藏。
- 用户认证：邮箱注册、邮箱验证、重发验证、登录拦截未验证邮箱、基础速率限制。
- 审核后台：支持导入批次查看、候选内容筛选、审核发布、拒绝和撤回发布。
- 内容导入：支持从爬虫导出的 JSONL 文件导入 B 站 / 小红书候选内容。

## 界面预览

> 【图片占位 1】首页总览：展示肌群图、性别切换、正背面切换和标签交互

> 【图片占位 2】肌群详情弹窗：展示肌群介绍、训练建议、教程卡片列表

> 【图片占位 3】个人中心：展示按肌群分类的收藏卡片

> 【图片占位 4】内容审核后台：展示导入批次页和候选内容列表页

## 当前状态

项目已完成前台浏览、账号认证、收藏、教程卡片读取、内容导入与审核后台的主闭环。

当前仓库已按公开发布方向清理，只保留源码、配置、文档和与项目运行/协作直接相关的文件。

## 技术栈

| 层级 | 选型 |
| --- | --- |
| 前端框架 | Next.js 16 + React 19 + App Router |
| UI | Tailwind CSS v4 + shadcn/ui + Base UI |
| 认证 | NextAuth.js v5（Credentials） |
| 数据校验 | Zod |
| 数据库 | Prisma 7 + SQLite（开发） |
| 邮件 | Nodemailer |
| 测试 | Vitest + React Testing Library |

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 初始化环境变量

```bash
cp .env.example .env
openssl rand -base64 32
```

把生成的随机值写入 `.env` 的 `AUTH_SECRET`。

本地开发默认使用 `EMAIL_DELIVERY_MODE=console`，注册后的验证链接会直接打印在服务端日志中。

### 3. 初始化数据库

```bash
pnpm prisma db push
pnpm prisma db seed
```

### 4. 启动开发环境

```bash
pnpm dev
```

打开 `http://localhost:3000` 即可访问首页。

## 环境变量

| 变量名 | 必填 | 说明 |
| --- | --- | --- |
| `AUTH_SECRET` | 是 | NextAuth 使用的密钥，必须替换示例值 |
| `DATABASE_URL` | 是 | 开发环境默认为 `file:./dev.db`，数据库文件位于仓库根目录 |
| `EMAIL_DELIVERY_MODE` | 是 | `console` 或 `smtp` |
| `TRUSTED_PROXY_DEPTH` | 否 | 反向代理链信任深度，默认 `1` |
| `ADMIN_EMAILS` | 建议 | 管理员邮箱白名单，支持逗号或换行分隔多个邮箱 |
| `SMTP_HOST` | `smtp` 模式必填 | SMTP 主机 |
| `SMTP_PORT` | `smtp` 模式必填 | SMTP 端口 |
| `SMTP_SECURE` | `smtp` 模式可选 | 是否启用 TLS |
| `SMTP_USER` | 视服务商而定 | SMTP 用户名 |
| `SMTP_PASS` | 视服务商而定 | SMTP 密码 |
| `SMTP_FROM` | `smtp` 模式必填 | 发件人地址 |

建议在任何环境中都显式配置 `ADMIN_EMAILS`，不要依赖开发环境回退行为。

## 内容导入与审核

### 命令行导入

```bash
pnpm import:bili:candidates -- --input /path/to/bili.jsonl
pnpm import:xhs:candidates -- --input /path/to/xhs.jsonl
```

### 站内导入与审核

1. 使用管理员账号登录。
2. 进入 `/admin/import-batches` 上传 JSONL 文件，查看导入结果。
3. 进入 `/admin/tutorial-candidates` 按平台、状态、肌群和关键词筛选候选内容。
4. 在候选详情页执行发布、拒绝或撤回发布。
5. 发布后的内容会进入首页肌群弹窗与用户收藏链路。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产包 |
| `pnpm start` | 启动生产模式服务 |
| `pnpm lint` | 运行 ESLint |
| `pnpm test` | 启动 Vitest watch |
| `pnpm test:run` | 一次性执行测试 |
| `pnpm prisma db push` | 同步 Prisma schema 到本地数据库 |
| `pnpm prisma db seed` | 导入教程种子数据 |

## 目录结构

```text
muscle-wiki/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── images/body-maps/
├── scripts/
│   ├── import-mediacrawler-bili.ts
│   └── import-mediacrawler-xhs.ts
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── login/
│   │   ├── profile/
│   │   ├── register/
│   │   ├── verify-email/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── admin/
│   │   ├── muscle-detail/
│   │   ├── muscle-map/
│   │   └── ui/
│   ├── data/
│   │   ├── muscles.json
│   │   └── tutorials.json
│   └── lib/
├── LICENSE
└── README.md
```

## 数据与权限模型概览

- `muscles.json`：静态肌群知识源，负责基础介绍、功能、训练方式与注意事项。
- `TutorialCard`：前台真正展示的正式教程卡片。
- `ExternalTutorialCandidate`：从外部平台导入的候选内容池。
- `ImportBatch`：每次 JSONL 导入任务的批次记录与统计结果。
- `Favorite`：用户收藏关系。
- `PendingRegistration`：待验证注册，邮箱验证成功后才会落入 `User`。

## 贡献

欢迎提交 Issue 和 Pull Request。

提交前建议至少执行：

```bash
pnpm lint
pnpm test:run
```

## License

本项目使用 [MIT License](./LICENSE)。

## 致谢

- 人体肌群 SVG 交互方案参考了 `react-muscle-highlighter` 的开源思路与素材整理方式。
- 外部平台教程内容版权归原作者及原平台所有，本项目仅做聚合与索引展示。

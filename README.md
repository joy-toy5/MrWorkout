This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

1. 初始化环境变量：

```bash
cp .env.example .env
openssl rand -base64 32
```

把生成的新值填进 `.env` 的 `AUTH_SECRET`，不要复用示例占位符。

本地开发默认使用 `EMAIL_DELIVERY_MODE=console`，注册后的验证链接会打印在服务端日志里；生产环境必须切换到 `smtp` 并配置 `SMTP_HOST`、`SMTP_PORT`、`SMTP_FROM` 等发信参数。

如果应用前面有一层你信任的反向代理，请设置 `TRUSTED_PROXY_DEPTH` 表示要信任 `x-forwarded-for` 最后几跳；默认值 `1` 只信任最靠近应用的那一跳。

2. 启动开发服务器：

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

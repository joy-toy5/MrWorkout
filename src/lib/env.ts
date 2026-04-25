import { z } from "zod";

export const AUTH_SECRET_PLACEHOLDER = "replace-with-a-random-secret";

const authSecretSchema = z
  .string()
  .trim()
  .min(32, "AUTH_SECRET 长度至少 32 个字符")
  .refine((value) => value !== AUTH_SECRET_PLACEHOLDER, {
    message: "AUTH_SECRET 不能使用示例占位符，请替换为真实随机密钥",
  });

export function validateAuthSecret(value: string | undefined) {
  if (!value?.trim()) {
    throw new Error("必须设置 AUTH_SECRET 环境变量");
  }

  return authSecretSchema.parse(value);
}

export function getAuthSecret() {
  return validateAuthSecret(process.env.AUTH_SECRET);
}

export function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() || "file:prisma/dev.db";
}

export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS?.trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(/[,\n]/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

const emailDeliveryModeSchema = z.enum(["console", "smtp"]);

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`必须设置 ${name} 环境变量`);
  }

  return value;
}

export function getTrustedProxyDepth() {
  const raw = process.env.TRUSTED_PROXY_DEPTH?.trim() || "1";
  const depth = Number.parseInt(raw, 10);

  if (!Number.isInteger(depth) || depth < 1) {
    throw new Error("TRUSTED_PROXY_DEPTH 必须是大于等于 1 的整数");
  }

  return depth;
}

export function getEmailDeliveryMode() {
  const raw =
    process.env.EMAIL_DELIVERY_MODE?.trim() ||
    (process.env.NODE_ENV === "production" ? "smtp" : "console");

  return emailDeliveryModeSchema.parse(raw);
}

export function getMailFromAddress() {
  if (getEmailDeliveryMode() === "console") {
    return process.env.SMTP_FROM?.trim() || "dev@localhost";
  }

  return getRequiredEnv("SMTP_FROM");
}

export function getSmtpConfig() {
  if (getEmailDeliveryMode() !== "smtp") {
    throw new Error("当前并未启用 SMTP 发信模式");
  }

  const port = Number.parseInt(getRequiredEnv("SMTP_PORT"), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT 必须是 1-65535 之间的整数");
  }

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if ((user && !pass) || (!user && pass)) {
    throw new Error("SMTP_USER 和 SMTP_PASS 必须同时配置，或同时留空");
  }

  return {
    host: getRequiredEnv("SMTP_HOST"),
    port,
    secure:
      process.env.SMTP_SECURE?.trim() === "true" ||
      (!process.env.SMTP_SECURE && port === 465),
    auth: user && pass ? { user, pass } : undefined,
  };
}

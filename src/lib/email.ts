import nodemailer, { type Transporter } from "nodemailer";
import {
  getEmailDeliveryMode,
  getMailFromAddress,
  getSmtpConfig,
} from "./env";

interface VerificationEmailInput {
  to: string;
  verificationUrl: string;
}

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const smtp = getSmtpConfig();
  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
  });
  return transporter;
}

export async function sendRegistrationVerificationEmail({
  to,
  verificationUrl,
}: VerificationEmailInput) {
  if (getEmailDeliveryMode() === "console") {
    console.info(`[auth] 邮箱验证链接 (${to}): ${verificationUrl}`);
    return;
  }

  const transport = getTransporter();
  const from = getMailFromAddress();

  await transport.sendMail({
    from,
    to,
    subject: "验证你的邮箱 | 肌肉百科",
    text: [
      "欢迎注册肌肉百科。",
      "",
      "请点击下方链接完成邮箱验证：",
      verificationUrl,
      "",
      "如果这不是你的操作，请忽略这封邮件。",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827;">
        <h2 style="margin-bottom: 12px;">验证你的邮箱</h2>
        <p>欢迎注册肌肉百科，请点击下方按钮完成邮箱验证。</p>
        <p style="margin: 24px 0;">
          <a
            href="${verificationUrl}"
            style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: #111827; color: #ffffff; text-decoration: none;"
          >
            验证邮箱
          </a>
        </p>
        <p>如果按钮无法打开，也可以复制以下链接到浏览器：</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
        <p>如果这不是你的操作，请忽略这封邮件。</p>
      </div>
    `,
  });
}

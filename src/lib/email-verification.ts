import crypto from "node:crypto";

const EMAIL_VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashEmailVerificationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString("base64url");

  return {
    token,
    tokenHash: hashEmailVerificationToken(token),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_WINDOW_MS),
  };
}

export function buildEmailVerificationUrl(
  baseUrl: string,
  token: string,
  email: string
) {
  const url = new URL("/verify-email", baseUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("email", email);
  return url.toString();
}

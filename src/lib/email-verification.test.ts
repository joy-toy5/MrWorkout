import { describe, expect, it } from "vitest";
import {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
  hashEmailVerificationToken,
  normalizeEmail,
} from "./email-verification";

describe("email verification helpers", () => {
  it("normalizes email addresses", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("creates hashable verification tokens", () => {
    const { token, tokenHash, expiresAt } = createEmailVerificationToken();

    expect(token.length).toBeGreaterThan(20);
    expect(tokenHash).toBe(hashEmailVerificationToken(token));
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("builds verification urls with token and email", () => {
    const url = buildEmailVerificationUrl(
      "https://example.com",
      "token-123",
      "user@example.com"
    );

    expect(url).toContain("/verify-email");
    expect(url).toContain("token=token-123");
    expect(url).toContain("email=user%40example.com");
  });
});

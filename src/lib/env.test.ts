import { describe, expect, it } from "vitest";
import { AUTH_SECRET_PLACEHOLDER, validateAuthSecret } from "./env";

describe("validateAuthSecret", () => {
  it("rejects missing secrets", () => {
    expect(() => validateAuthSecret(undefined)).toThrow(
      "必须设置 AUTH_SECRET 环境变量"
    );
  });

  it("rejects placeholder secrets", () => {
    expect(() => validateAuthSecret(AUTH_SECRET_PLACEHOLDER)).toThrow(
      "AUTH_SECRET 不能使用示例占位符，请替换为真实随机密钥"
    );
  });

  it("accepts sufficiently long secrets", () => {
    expect(validateAuthSecret("a".repeat(32))).toBe("a".repeat(32));
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { getClientIp } from "./rate-limit";

describe("getClientIp", () => {
  const originalTrustedProxyDepth = process.env.TRUSTED_PROXY_DEPTH;

  afterEach(() => {
    if (originalTrustedProxyDepth === undefined) {
      delete process.env.TRUSTED_PROXY_DEPTH;
      return;
    }

    process.env.TRUSTED_PROXY_DEPTH = originalTrustedProxyDepth;
  });

  it("prefers platform-injected headers", () => {
    const request = new Request("https://example.com/api/test", {
      headers: {
        "x-vercel-forwarded-for": "203.0.113.10",
        "x-forwarded-for": "198.51.100.1, 198.51.100.2",
      },
    });

    expect(getClientIp(request)).toBe("203.0.113.10");
  });

  it("trusts the last hop in x-forwarded-for by default", () => {
    delete process.env.TRUSTED_PROXY_DEPTH;

    const request = new Request("https://example.com/api/test", {
      headers: {
        "x-forwarded-for": "1.1.1.1, 2.2.2.2",
      },
    });

    expect(getClientIp(request)).toBe("2.2.2.2");
  });

  it("supports multiple trusted proxy hops", () => {
    process.env.TRUSTED_PROXY_DEPTH = "2";

    const request = new Request("https://example.com/api/test", {
      headers: {
        "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3",
      },
    });

    expect(getClientIp(request)).toBe("2.2.2.2");
  });
});

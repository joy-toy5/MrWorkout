import { describe, expect, it } from "vitest";
import { normalizeRemoteAssetUrl } from "./media-url";

describe("media url helpers", () => {
  it("keeps xiaohongshu images on their original host while upgrading to https", () => {
    expect(
      normalizeRemoteAssetUrl(
        "http://sns-webpic-qc.xhscdn.com/example/image.webp"
      )
    ).toBe("https://sns-webpic-qc.xhscdn.com/example/image.webp");
  });

  it("proxies bilibili cover images through wsrv", () => {
    expect(
      normalizeRemoteAssetUrl(
        "http://i0.hdslb.com/bfs/archive/example-cover.jpg"
      )
    ).toBe("https://wsrv.nl/?url=i0.hdslb.com/bfs/archive/example-cover.jpg");
  });

  it("does not wrap an already proxied wsrv url twice", () => {
    expect(
      normalizeRemoteAssetUrl(
        "https://wsrv.nl/?url=i2.hdslb.com/bfs/archive/example-cover.jpg"
      )
    ).toBe("https://wsrv.nl/?url=i2.hdslb.com/bfs/archive/example-cover.jpg");
  });
});

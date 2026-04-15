import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://i0.hdslb.com/**"),
      new URL("https://i1.hdslb.com/**"),
      new URL("https://i2.hdslb.com/**"),
      new URL("https://sns-webpic-qc.xhscdn.com/**"),
      new URL("https://ci.xiaohongshu.com/**"),
      new URL("https://picx.zhimg.com/**"),
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wsrv.nl",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i0.hdslb.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i1.hdslb.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i2.hdslb.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "sns-webpic-qc.xhscdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ci.xiaohongshu.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picx.zhimg.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

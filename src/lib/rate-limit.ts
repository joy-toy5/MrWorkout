import { isIP } from "node:net";
import { getTrustedProxyDepth } from "./env";

/**
 * 简单的内存级速率限制器
 * 适用于单实例部署（Vercel Serverless 每个实例独立，但仍能有效减缓暴力攻击）
 * 生产环境如需更强保护，可替换为 @upstash/ratelimit + Redis
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 定期清理过期条目，防止内存泄漏
const CLEANUP_INTERVAL = 60_000; // 1 分钟
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * 检查是否超过速率限制
 * @param key     限制键（如 IP 或 IP+路径）
 * @param limit   窗口内最大请求数
 * @param windowMs 时间窗口（毫秒）
 * @returns { limited: boolean, remaining: number, resetAt: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; remaining: number; resetAt: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // 新窗口
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    limited: false,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

const PLATFORM_IP_HEADERS = [
  "x-vercel-forwarded-for",
  "cf-connecting-ip",
  "fly-client-ip",
  "fastly-client-ip",
];

function normalizeIpCandidate(value: string) {
  const trimmed = value.trim().replace(/^"|"$/g, "");
  if (!trimmed) return null;

  if (isIP(trimmed)) {
    return trimmed;
  }

  const bracketMatch = trimmed.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketMatch && isIP(bracketMatch[1])) {
    return bracketMatch[1];
  }

  const ipv4WithPortMatch = trimmed.match(
    /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/
  );
  if (ipv4WithPortMatch?.[1] && isIP(ipv4WithPortMatch[1])) {
    return ipv4WithPortMatch[1];
  }

  return null;
}

/**
 * 从请求中提取客户端 IP
 * 1. 优先信任部署平台注入的专用 IP 头
 * 2. 对通用 x-forwarded-for，仅信任代理追加的最后 N 跳（默认 1 跳）
 */
export function getClientIp(request: Request): string {
  for (const header of PLATFORM_IP_HEADERS) {
    const value = request.headers.get(header);
    if (!value) continue;

    const normalized = normalizeIpCandidate(value);
    if (normalized) {
      return normalized;
    }
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) {
    return "unknown";
  }

  const chain = forwarded
    .split(",")
    .map((value) => normalizeIpCandidate(value))
    .filter((value): value is string => Boolean(value));

  if (chain.length === 0) {
    return "unknown";
  }

  const trustedDepth = getTrustedProxyDepth();
  return chain.at(-trustedDepth) ?? "unknown";
}

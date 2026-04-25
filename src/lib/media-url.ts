const BILIBILI_IMAGE_HOST_SUFFIX = ".hdslb.com";
const IMAGE_PROXY_BASE = "https://wsrv.nl/?url=";

function stripProtocol(value: string) {
  return value.replace(/^https?:\/\//i, "");
}

function isBilibiliImageHost(hostname: string) {
  return (
    hostname === "hdslb.com" ||
    hostname.endsWith(BILIBILI_IMAGE_HOST_SUFFIX)
  );
}

export function normalizeRemoteAssetUrl(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("//")) {
    return normalizeRemoteAssetUrl(`https:${trimmed}`);
  }

  const normalized = trimmed.replace(/^http:\/\//i, "https://");

  if (normalized.startsWith(IMAGE_PROXY_BASE)) {
    return normalized;
  }

  try {
    const url = new URL(normalized);

    if (isBilibiliImageHost(url.hostname)) {
      return `${IMAGE_PROXY_BASE}${stripProtocol(normalized)}`;
    }
  } catch {
    return normalized;
  }

  return normalized;
}

export function isRemoteAssetUrl(value: string | null | undefined) {
  const normalized = normalizeRemoteAssetUrl(value);
  return normalized.startsWith("https://") || normalized.startsWith("http://");
}

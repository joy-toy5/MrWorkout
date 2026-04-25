"use client";

import { useState } from "react";
import { BookOpen, Play } from "lucide-react";
import { normalizeRemoteAssetUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

interface TutorialCoverImageProps {
  src: string | null | undefined;
  alt: string;
  contentType: string;
  className?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
}

function canRenderImage(src: string) {
  return (
    src.startsWith("/") ||
    src.startsWith("https://") ||
    src.startsWith("http://")
  );
}

function isVideoContent(contentType: string) {
  return contentType.trim().toUpperCase() === "VIDEO";
}

export function TutorialCoverImage({
  src,
  alt,
  contentType,
  className,
  imageClassName,
  loading = "lazy",
}: TutorialCoverImageProps) {
  const normalizedSrc = normalizeRemoteAssetUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shouldRenderImage =
    canRenderImage(normalizedSrc) && failedSrc !== normalizedSrc;

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {shouldRenderImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={normalizedSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          referrerPolicy={
            normalizedSrc.startsWith("http://") ||
            normalizedSrc.startsWith("https://")
              ? "no-referrer"
              : undefined
          }
          className={cn("absolute inset-0 h-full w-full object-cover", imageClassName)}
          onError={() => setFailedSrc(normalizedSrc)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground/40">
          {isVideoContent(contentType) ? (
            <Play className="size-10" />
          ) : (
            <BookOpen className="size-10" />
          )}
        </div>
      )}
    </div>
  );
}

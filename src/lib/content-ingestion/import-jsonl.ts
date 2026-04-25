import type { PrismaClient } from "@/generated/prisma/client";
import { normalizeRemoteAssetUrl } from "@/lib/media-url";
import {
  inferMuscleGroupId,
  mergeMatchedKeywords,
  splitMatchedKeywords,
} from "@/lib/content-ingestion/muscle-keyword-rules";

export const IMPORT_PLATFORMS = ["BILIBILI", "XIAOHONGSHU"] as const;

export type ImportPlatform = (typeof IMPORT_PLATFORMS)[number];

type RawImportRecord = Record<string, unknown>;

interface NormalizedImportCandidate {
  sourceId: string;
  sourceUrl: string;
  title: string;
  coverImage?: string;
  creatorName?: string;
  publishedAt?: Date;
  contentType: "IMAGE_TEXT" | "VIDEO";
  matchedKeywords: string[];
  summary?: string;
  muscleGroupId?: string;
  rawPayload: string;
  ingestStatus: "NEW" | "FILTERED";
}

export interface ImportCandidatesFromJsonlOptions {
  prisma: PrismaClient;
  platform: ImportPlatform;
  lines: Iterable<string> | AsyncIterable<string>;
  fileLabel?: string;
  note?: string;
  source?: string;
}

export interface ImportBatchSummary {
  batchId: string;
  totalCount: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
}

function asNonEmptyString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function asDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(millis);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const maybeNumber = Number(trimmed);
    if (!Number.isNaN(maybeNumber)) {
      return asDate(maybeNumber);
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return undefined;
}

function splitDelimitedUrls(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw
      .map((value) => String(value).trim())
      .filter(Boolean);
  }

  if (typeof raw !== "string") {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildBiliUrl(record: RawImportRecord) {
  const explicitUrl = asNonEmptyString(record.video_url);
  if (explicitUrl) {
    return explicitUrl;
  }

  const bvid = asNonEmptyString(record.bvid);
  if (bvid) {
    return `https://www.bilibili.com/video/${bvid}`;
  }

  const sourceId = asNonEmptyString(record.video_id);
  if (sourceId) {
    return `https://www.bilibili.com/video/av${sourceId}`;
  }

  return undefined;
}

function inferXhsContentType(rawType: unknown): "IMAGE_TEXT" | "VIDEO" {
  const normalized = asNonEmptyString(rawType)?.toLowerCase();
  return normalized === "video" ? "VIDEO" : "IMAGE_TEXT";
}

function normalizeBiliRecord(
  record: RawImportRecord
): NormalizedImportCandidate | null {
  const sourceId = asNonEmptyString(record.video_id);
  const sourceUrl = buildBiliUrl(record);
  const title = asNonEmptyString(record.title);

  if (!sourceId || !sourceUrl || !title) {
    return null;
  }

  const summary = asNonEmptyString(record.desc);
  const matchedKeywords = splitMatchedKeywords(record.source_keyword);
  const muscleGroupId =
    inferMuscleGroupId({
      platform: "BILIBILI",
      title,
      summary,
      matchedKeywords,
    }) ?? undefined;

  return {
    sourceId,
    sourceUrl,
    title,
    coverImage: normalizeRemoteAssetUrl(asNonEmptyString(record.video_cover_url)),
    creatorName: asNonEmptyString(record.nickname),
    publishedAt: asDate(record.create_time),
    contentType: "VIDEO",
    matchedKeywords,
    summary,
    muscleGroupId,
    rawPayload: JSON.stringify(record),
    ingestStatus: muscleGroupId ? "NEW" : "FILTERED",
  };
}

function normalizeXhsRecord(
  record: RawImportRecord
): NormalizedImportCandidate | null {
  const sourceId = asNonEmptyString(record.note_id);
  const sourceUrl = asNonEmptyString(record.note_url);
  const summary = asNonEmptyString(record.desc);
  const title = asNonEmptyString(record.title) || summary?.slice(0, 80);

  if (!sourceId || !sourceUrl || !title) {
    return null;
  }

  const matchedKeywords = mergeMatchedKeywords(
    record.tag_list,
    splitMatchedKeywords(record.source_keyword)
  );
  const muscleGroupId =
    inferMuscleGroupId({
      platform: "XIAOHONGSHU",
      title,
      summary,
      matchedKeywords,
    }) ?? undefined;

  const imageList = splitDelimitedUrls(record.image_list);

  return {
    sourceId,
    sourceUrl,
    title,
    coverImage: normalizeRemoteAssetUrl(imageList[0]),
    creatorName: asNonEmptyString(record.nickname),
    publishedAt: asDate(record.time),
    contentType: inferXhsContentType(record.type),
    matchedKeywords,
    summary,
    muscleGroupId,
    rawPayload: JSON.stringify(record),
    ingestStatus: muscleGroupId ? "NEW" : "FILTERED",
  };
}

function normalizeImportRecord(
  platform: ImportPlatform,
  record: RawImportRecord
) {
  if (platform === "BILIBILI") {
    return normalizeBiliRecord(record);
  }

  return normalizeXhsRecord(record);
}

export async function importCandidatesFromJsonl({
  prisma,
  platform,
  lines,
  fileLabel,
  note,
  source = "MEDIACRAWLER",
}: ImportCandidatesFromJsonlOptions): Promise<ImportBatchSummary> {
  const batch = await prisma.importBatch.create({
    data: {
      source,
      platform,
      filePath: fileLabel || null,
      status: "RUNNING",
      note,
    },
  });

  let totalCount = 0;
  let importedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  try {
    for await (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      totalCount += 1;

      try {
        const parsed = JSON.parse(line) as RawImportRecord;
        const normalized = normalizeImportRecord(platform, parsed);

        if (!normalized) {
          skippedCount += 1;
          continue;
        }

        const existing = await prisma.externalTutorialCandidate.findUnique({
          where: {
            platform_sourceId: {
              platform,
              sourceId: normalized.sourceId,
            },
          },
        });

        if (existing) {
          skippedCount += 1;
          continue;
        }

        await prisma.externalTutorialCandidate.create({
          data: {
            importBatchId: batch.id,
            platform,
            sourceId: normalized.sourceId,
            sourceUrl: normalized.sourceUrl,
            title: normalized.title,
            coverImage: normalized.coverImage,
            creatorName: normalized.creatorName,
            publishedAt: normalized.publishedAt,
            contentType: normalized.contentType,
            muscleGroupId: normalized.muscleGroupId,
            matchedKeywords: JSON.stringify(normalized.matchedKeywords),
            summary: normalized.summary,
            rawPayload: normalized.rawPayload,
            ingestStatus: normalized.ingestStatus,
          },
        });

        importedCount += 1;
      } catch (error) {
        failedCount += 1;
        console.error(
          `[import-${platform.toLowerCase()}] 第 ${totalCount} 条记录处理失败:`,
          error
        );
      }
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "SUCCEEDED",
        finishedAt: new Date(),
        totalCount,
        importedCount,
        skippedCount,
        failedCount,
      },
    });

    return {
      batchId: batch.id,
      totalCount,
      importedCount,
      skippedCount,
      failedCount,
    };
  } catch (error) {
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        totalCount,
        importedCount,
        skippedCount,
        failedCount,
        note: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

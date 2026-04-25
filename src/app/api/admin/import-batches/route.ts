import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import {
  IMPORT_PLATFORMS,
  importCandidatesFromJsonl,
  type ImportPlatform,
} from "@/lib/content-ingestion/import-jsonl";

function isImportPlatform(value: string): value is ImportPlatform {
  return IMPORT_PLATFORMS.includes(value as ImportPlatform);
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "无权访问导入后台" }, { status: 403 });
    }

    const formData = await request.formData();
    const rawPlatform = String(formData.get("platform") || "").trim().toUpperCase();
    const note = String(formData.get("note") || "").trim();
    const file = formData.get("file");

    if (!isImportPlatform(rawPlatform)) {
      return NextResponse.json({ error: "无效的平台类型" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "缺少上传文件" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".jsonl")) {
      return NextResponse.json({ error: "当前只支持上传 .jsonl 文件" }, { status: 400 });
    }

    const rawText = await file.text();
    const hasContent = rawText.split(/\r?\n/).some((line) => line.trim());

    if (!hasContent) {
      return NextResponse.json({ error: "导入文件为空" }, { status: 400 });
    }

    const summary = await importCandidatesFromJsonl({
      prisma,
      platform: rawPlatform,
      lines: rawText.split(/\r?\n/),
      fileLabel: `upload:${file.name}`,
      note: note || `由 ${session.user.email} 通过后台上传`,
      source: "MEDIACRAWLER",
    });

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    );
  }
}

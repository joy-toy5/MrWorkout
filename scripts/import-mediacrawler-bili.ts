import "dotenv/config";

import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import readline from "node:readline";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { getDatabaseUrl } from "../src/lib/env";
import { importCandidatesFromJsonl } from "../src/lib/content-ingestion/import-jsonl";

interface ImportArgs {
  input: string;
  note?: string;
}

const adapter = new PrismaLibSql({
  url: getDatabaseUrl(),
});
const prisma = new PrismaClient({ adapter });

function parseArgs(argv: string[]): ImportArgs {
  let input = "";
  let note = "";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--input" && next) {
      input = next;
      index += 1;
      continue;
    }

    if (arg === "--note" && next) {
      note = next;
      index += 1;
    }
  }

  if (!input) {
    throw new Error("缺少 --input 参数，请传入 MediaCrawler 导出的 B站 JSONL 文件路径");
  }

  return {
    input,
    note: note || undefined,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = resolve(args.input);

  await access(inputPath);

  const input = createReadStream(inputPath, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input,
    crlfDelay: Number.POSITIVE_INFINITY,
  });

  try {
    const summary = await importCandidatesFromJsonl({
      prisma,
      platform: "BILIBILI",
      lines: rl,
      fileLabel: inputPath,
      note: args.note,
    });

    console.log("B站候选导入完成");
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[import-mediacrawler-bili] 导入失败:", error);
  process.exit(1);
});

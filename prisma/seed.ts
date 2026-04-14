import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import tutorials from "../src/data/tutorials.json";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 开始播种教程卡片数据...");

  // 先清空现有数据（避免重复播种）
  await prisma.tutorialCard.deleteMany();
  console.log("  已清空 TutorialCard 表");

  // 批量插入教程卡片
  let count = 0;
  for (const tutorial of tutorials) {
    await prisma.tutorialCard.create({
      data: {
        id: tutorial.id,
        muscleGroupId: tutorial.muscleGroupId,
        title: tutorial.title,
        coverImage: tutorial.coverImage,
        sourceUrl: tutorial.sourceUrl,
        platform: tutorial.platform === "bilibili" ? "BILIBILI" : "XIAOHONGSHU",
        contentType:
          tutorial.contentType === "video" ? "VIDEO" : "IMAGE_TEXT",
      },
    });
    count++;
  }

  console.log(`  ✅ 成功插入 ${count} 条教程卡片数据`);

  // 验证数据
  const totalCount = await prisma.tutorialCard.count();
  console.log(`  📊 数据库中共有 ${totalCount} 条教程卡片`);

  // 按肌群统计
  const groups = await prisma.tutorialCard.groupBy({
    by: ["muscleGroupId"],
    _count: { id: true },
  });
  console.log("\n  按肌群分布:");
  for (const group of groups) {
    console.log(`    ${group.muscleGroupId}: ${group._count.id} 张`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("\n🎉 播种完成！");
  })
  .catch(async (e) => {
    console.error("❌ 播种失败:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

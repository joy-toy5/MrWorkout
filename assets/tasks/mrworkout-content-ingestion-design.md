# MrWorkout 内容源接入设计

## 1. 目标

为 `MrWorkout` 增加一套面向“小红书 + B站”的离线内容接入能力，用于周期性补充教程卡片数据。

本方案的目标不是把爬虫系统接进线上站点，而是建立一条稳定的离线工作流：

1. 独立运行采集任务，低频更新候选内容。
2. 将采集结果导入 `muscle-wiki` 自己的数据库，而不是复用第三方项目的表结构。
3. 在站内提供审核后台，对候选内容进行人工筛选、编辑、发布。
4. 发布后的内容进入现有 `TutorialCard` 体系，继续复用当前首页弹窗、收藏和个人中心能力。

---

## 2. 现状

当前 `muscle-wiki` 的核心数据模型很简单：

- `User`
- `PendingRegistration`
- `TutorialCard`
- `Favorite`

其中 `TutorialCard` 只有以下字段：

- `id`
- `muscleGroupId`
- `title`
- `coverImage`
- `sourceUrl`
- `platform`
- `contentType`

这套模型足够支撑“展示和收藏”，但不够支撑“内容采集、候选审核、发布历史、批次管理”。

同时，当前教程数据来自：

- `src/data/tutorials.json`
- `prisma/seed.ts`

也就是说，现阶段的数据来源是静态文件，不具备持续运营能力。

---

## 3. 接入原则

### 3.1 不把 MediaCrawler 直接接入站点运行时

MediaCrawler 只作为“离线采集工具”使用。

原因：

- 它是 Python + Playwright/CDP 驱动的独立系统。
- `muscle-wiki` 是 Next.js + Prisma 的站点。
- 两者生命周期、依赖、故障模型完全不同。
- 爬虫失败不应该影响网站可用性。

结论：

- 网站只消费“已审核后的结构化数据”。
- 爬虫系统运行在独立环境，通过导入脚本把结果送入站点数据库。

### 3.2 先候选，后发布

采集结果不能直接进入 `TutorialCard`。

原因：

- 搜索结果噪音高。
- 同一肌群可能搜到泛流量内容、营销内容、错误动作内容。
- 小红书结果更需要人工判断。

结论：

- 所有抓取结果先进入“候选池”。
- 审核通过后，才生成正式 `TutorialCard`。

### 3.3 B站先行，小红书补充

推荐执行顺序：

1. 先接入 B站。
2. 跑通导入 + 审核 + 发布闭环。
3. 再接入小红书。

原因：

- B站视频内容结构更稳定。
- 标题、封面、视频页 URL 天然适合教程卡片。
- 小红书登录态、签名、风控和字段漂移的维护成本更高。

---

## 4. 总体架构

### 4.1 系统边界

- `MediaCrawler`
  - 负责离线采集原始数据
  - 输出 `jsonl` / `json` / `sqlite`
- `Import Worker`
  - 负责读取采集结果
  - 做字段归一化、去重、肌群映射
  - 写入 `muscle-wiki` 的候选表
- `muscle-wiki`
  - 提供审核后台
  - 提供发布动作
  - 展示正式 `TutorialCard`

### 4.2 数据流

1. 在采集机上运行 MediaCrawler。
2. 采集结果生成批次文件。
3. 执行导入脚本，将结果写入候选池。
4. 管理员在后台审核候选内容。
5. 审核通过的候选内容生成正式 `TutorialCard`。
6. 首页弹窗和个人中心继续只读取 `TutorialCard`。

---

## 5. 数据模型设计

### 5.1 保留现有 `TutorialCard`

现有 `TutorialCard` 不应直接废弃。

原因：

- 首页弹窗和收藏逻辑已经围绕它构建完成。
- 它是当前站点的“发布层模型”。

建议只做小幅扩展，而不是重建。

### 5.2 新增候选内容模型

建议新增 `ExternalTutorialCandidate`。

建议字段：

```prisma
model ExternalTutorialCandidate {
  id                 String   @id @default(cuid())
  importBatchId      String
  platform           String   // "XIAOHONGSHU" | "BILIBILI"
  sourceId           String
  sourceUrl          String
  title              String
  coverImage         String?
  creatorName        String?
  creatorUrl         String?
  publishedAt        DateTime?
  contentType        String   // "IMAGE_TEXT" | "VIDEO"
  muscleGroupId      String?
  matchedKeywords    String   // JSON string
  summary            String?
  rawPayload         String   // JSON string
  ingestStatus       String   // "NEW" | "FILTERED" | "APPROVED" | "REJECTED" | "PUBLISHED"
  reviewNote         String?
  reviewedByUserId   String?
  reviewedAt         DateTime?
  publishedCardId    String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([importBatchId])
  @@index([platform])
  @@index([muscleGroupId])
  @@index([ingestStatus])
  @@unique([platform, sourceId])
}
```

设计意图：

- `platform + sourceId` 负责天然去重。
- `rawPayload` 保留原始抓取内容，方便后续补字段和回放问题。
- `ingestStatus` 负责表达候选生命周期。
- `publishedCardId` 用于追踪它最终生成了哪张正式卡片。

### 5.3 新增导入批次模型

建议新增 `ImportBatch`。

```prisma
model ImportBatch {
  id             String   @id @default(cuid())
  source         String   // "MEDIACRAWLER"
  platform       String   // "XIAOHONGSHU" | "BILIBILI"
  filePath       String?
  startedAt      DateTime @default(now())
  finishedAt     DateTime?
  status         String   // "RUNNING" | "SUCCEEDED" | "FAILED"
  totalCount     Int      @default(0)
  importedCount  Int      @default(0)
  skippedCount   Int      @default(0)
  failedCount    Int      @default(0)
  note           String?
}
```

设计意图：

- 让运营和开发都能回答“这批内容是什么时候导入的”。
- 让失败批次可追踪、可重放。

### 5.4 适度扩展 `TutorialCard`

建议扩展现有 `TutorialCard`，增加来源元信息，而不是只保留最小展示字段。

建议补充字段：

```prisma
model TutorialCard {
  id               String   @id @default(cuid())
  muscleGroupId    String
  title            String
  coverImage       String
  sourceUrl        String
  platform         String
  contentType      String
  sourceId         String?
  creatorName      String?
  publishedAt      DateTime?
  importBatchId    String?
  candidateId      String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  favorites        Favorite[]

  @@index([muscleGroupId])
  @@index([platform])
}
```

设计意图：

- 未来能从正式卡片回溯到导入批次和候选记录。
- 便于后续做“刷新来源数据”“失效检测”“批量下线”。

---

## 6. 字段映射设计

### 6.1 B站映射

从 MediaCrawler 的 B站结果中，优先提取这些字段：

- `video_id` 或 `aid/bvid` -> `sourceId`
- `video_url` -> `sourceUrl`
- `title` -> `title`
- `video_cover_url` -> `coverImage`
- `nickname` -> `creatorName`
- `create_time` -> `publishedAt`
- 固定写入 `platform = "BILIBILI"`
- 固定写入 `contentType = "VIDEO"`
- `source_keyword` -> `matchedKeywords`
- 原始整条记录 -> `rawPayload`

### 6.2 小红书映射

从 MediaCrawler 的小红书结果中，优先提取这些字段：

- `note_id` -> `sourceId`
- `note_url` -> `sourceUrl`
- `title` -> `title`
- `image_list[0]` 或主图字段 -> `coverImage`
- `nickname` -> `creatorName`
- `time` 或发布时间字段 -> `publishedAt`
- `type` 决定 `contentType`
  - 图文 -> `IMAGE_TEXT`
  - 视频 -> `VIDEO`
- 固定写入 `platform = "XIAOHONGSHU"`
- `source_keyword` -> `matchedKeywords`
- 原始整条记录 -> `rawPayload`

### 6.3 肌群映射

采集导入时不建议完全手填 `muscleGroupId`，而是走“关键词规则 + 人工修正”。

建议新增一份规则配置，例如：

```ts
type MuscleKeywordRule = {
  muscleGroupId: string;
  keywords: string[];
  excludeKeywords?: string[];
  platform?: "BILIBILI" | "XIAOHONGSHU";
};
```

规则示例：

- `chest`
  - `胸肌训练`
  - `卧推`
  - `上胸`
  - `下胸`
- `deltoids`
  - `肩部训练`
  - `三角肌`
  - `侧平举`
- `back`
  - `背阔肌`
  - `划船`
  - `引体向上`

处理顺序：

1. 采集时由关键词来源先做第一层映射。
2. 导入时按标题进行二次匹配。
3. 审核后台允许人工改 `muscleGroupId`。

---

## 7. 导入 Worker 设计

### 7.1 形态

推荐在 `muscle-wiki` 仓库内新增独立导入脚本，例如：

- `scripts/import-mediacrawler-bili.ts`
- `scripts/import-mediacrawler-xhs.ts`
- 或统一为 `scripts/import-mediacrawler.ts`

它不参与 Next.js 请求链路，只是一个离线命令。

### 7.2 输入

支持以下输入形式：

- `MediaCrawler` 导出的 `jsonl`
- `MediaCrawler` 导出的 `json`
- 后续可选支持读取其 SQLite

第一阶段建议只支持 `jsonl`。

原因：

- 流式读取简单
- 适合大文件
- 和 MediaCrawler 默认输出兼容

### 7.3 导入步骤

导入流程建议固定为：

1. 创建 `ImportBatch`
2. 逐条读取外部记录
3. 转换为统一候选结构
4. 计算 `platform + sourceId` 去重
5. 做关键词过滤和肌群映射
6. 写入 `ExternalTutorialCandidate`
7. 更新批次统计信息

### 7.4 过滤规则

建议在导入阶段加一层弱过滤：

- 标题为空直接跳过
- 无外链直接跳过
- 标题命中明显营销词时标记为 `FILTERED`
- 与目标肌群完全无关时标记为 `FILTERED`

但不要在导入阶段做过强自动拒绝。

原因：

- 你后面有人工审核后台
- 导入阶段过度过滤会误伤本来有价值的内容

---

## 8. 审核后台设计

### 8.1 路由建议

当前 `src/app` 还没有后台路由，建议新增：

- `/admin`
- `/admin/tutorial-candidates`
- `/admin/tutorial-candidates/[id]`
- `/admin/import-batches`

### 8.2 最小页面集合

#### 候选列表页

展示：

- 标题
- 平台
- 肌群
- 封面
- 创作者
- 导入批次
- 审核状态
- 发布时间

筛选：

- 平台
- 肌群
- 状态
- 批次
- 关键词搜索

#### 候选详情页

展示：

- 标题
- 封面
- 外链
- 平台
- 创作者
- 自动匹配的肌群
- 原始 payload
- 审核意见

操作：

- 修改标题
- 修改封面
- 修改肌群
- 写审核备注
- 通过
- 拒绝

#### 批次页

展示：

- 批次号
- 平台
- 开始/结束时间
- 总数
- 导入成功数
- 跳过数
- 失败数

### 8.3 审核动作设计

审核通过：

1. 读取候选记录
2. 生成或更新正式 `TutorialCard`
3. 将候选状态改为 `PUBLISHED`
4. 回填 `publishedCardId`

审核拒绝：

1. 候选状态改为 `REJECTED`
2. 保留 `reviewNote`

不建议直接删除候选记录。

原因：

- 需要保留审核轨迹
- 后续可重新判断
- 便于排查导入规则问题

---

## 9. 运行计划

### 9.1 采集频率

建议：

- B站：每 2 周一次
- 小红书：每月一次

如果某一轮质量差，可以只重新采一个平台。

### 9.2 批次命名

建议每次导入都带批次标识，例如：

- `2026-04-bili-01`
- `2026-04-xhs-01`

这样运营和开发都能快速定位来源。

### 9.3 失败隔离

要求：

- B站失败，不影响小红书批次
- 小红书失败，不影响网站线上功能
- 单条记录失败，不影响整批导入

---

## 10. 分阶段实施计划

### 阶段 A：打基础

目标：

- 建立候选池
- 建立导入批次
- 跑通 B站导入闭环

任务：

1. 修改 Prisma schema
2. 生成迁移
3. 新增候选导入脚本
4. 完成 B站字段映射
5. 完成批次记录

### 阶段 B：做审核后台

目标：

- 在站内完成审核与发布

任务：

1. 新增后台路由
2. 新增候选列表页
3. 新增候选详情页
4. 新增“审核通过 -> 发布为 TutorialCard”的 API

### 阶段 C：接入小红书

目标：

- 接入第二内容源

任务：

1. 新增小红书导入脚本
2. 完成小红书字段归一化
3. 加入更严格的人工审核要求

### 阶段 D：提高效率

目标：

- 降低人工成本

任务：

1. 增加标题相似度去重
2. 增加创作者白名单
3. 增加批量审核
4. 增加已发布卡片回溯来源

---

## 11. 验收标准

### 第一阶段验收

- 能从 B站导入一批候选内容
- 候选内容能在后台列表中显示
- 审核通过后能生成正式 `TutorialCard`
- 首页弹窗能展示新发布卡片

### 第二阶段验收

- 小红书导入成功
- 平台字段归一化正确
- 被拒绝内容不会进入正式卡片

### 长期验收

- 每月一次导入可以稳定完成
- 新增内容不需要手改数据库
- 运营只需要在后台审核和发布

---

## 12. 明确不做的事情

第一阶段不做：

- 不把 MediaCrawler 直接部署成线上依赖
- 不做实时自动同步
- 不抓评论做前台展示
- 不做自动发布
- 不做复杂推荐算法

这样可以把复杂度控制在“可落地、可维护”的范围内。

---

## 13. 推荐落地顺序

建议按这个顺序推进：

1. 先扩展 Prisma schema
2. 先做 B站离线导入
3. 再做审核后台
4. 审核通过后发布到 `TutorialCard`
5. 最后再接小红书

一句话总结：

`MrWorkout` 需要的不是“把爬虫接进网站”，而是“建立一条从外部内容采集到站内审核发布的内容供应链”。

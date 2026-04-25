export type ContentPlatform = "BILIBILI" | "XIAOHONGSHU";

export interface MuscleKeywordRule {
  muscleGroupId: string;
  keywords: string[];
  excludeKeywords?: string[];
  platform?: ContentPlatform;
}

const KEYWORD_ONLY_MATCH_THRESHOLD = 8;

const MUSCLE_KEYWORD_RULES: MuscleKeywordRule[] = [
  {
    muscleGroupId: "trapezius",
    keywords: ["斜方肌", "耸肩", "肩颈放松"],
  },
  {
    muscleGroupId: "deltoids",
    keywords: [
      "三角肌",
      "肩部训练",
      "推肩",
      "侧平举",
      "前平举",
      "后束",
      "面拉",
    ],
  },
  {
    muscleGroupId: "chest",
    keywords: [
      "胸肌",
      "胸部训练",
      "卧推",
      "上胸",
      "下胸",
      "飞鸟",
      "俯卧撑",
    ],
  },
  {
    muscleGroupId: "upper-back",
    keywords: [
      "上背",
      "背部训练",
      "背阔肌",
      "划船",
      "引体向上",
      "高位下拉",
      "菱形肌",
    ],
    excludeKeywords: ["下背", "竖脊肌", "腰背"],
  },
  {
    muscleGroupId: "erector-spinae",
    keywords: ["竖脊肌", "下背", "腰背", "罗马椅", "背部伸展"],
  },
  {
    muscleGroupId: "biceps",
    keywords: ["肱二头", "二头弯举", "弯举"],
  },
  {
    muscleGroupId: "triceps",
    keywords: ["肱三头", "绳索下压", "臂屈伸", "窄距卧推"],
  },
  {
    muscleGroupId: "forearm",
    keywords: ["前臂", "握力", "腕屈伸"],
  },
  {
    muscleGroupId: "abs",
    keywords: ["腹肌", "腹直肌", "卷腹", "平板支撑", "核心训练"],
    excludeKeywords: ["腹斜肌", "侧腹"],
  },
  {
    muscleGroupId: "obliques",
    keywords: ["腹斜肌", "侧腹", "俄罗斯转体", "侧桥"],
  },
  {
    muscleGroupId: "gluteal",
    keywords: [
      "臀部训练",
      "臀肌",
      "臀大肌",
      "臀中肌",
      "臀桥",
      "臀推",
      "翘臀",
      "练臀",
      "蜜桃臀",
      "臀腿训练",
      "臀凹陷",
      "提臀",
      "妈妈臀",
    ],
  },
  {
    muscleGroupId: "quadriceps",
    keywords: ["股四头", "大腿前侧", "腿伸", "保加利亚分腿蹲"],
  },
  {
    muscleGroupId: "hamstrings",
    keywords: ["腘绳肌", "腿弯举", "大腿后侧", "罗马尼亚硬拉", "rdl"],
  },
  {
    muscleGroupId: "adductors",
    keywords: ["内收肌", "大腿内侧", "夹腿"],
  },
  {
    muscleGroupId: "calves",
    keywords: ["小腿", "腓肠肌", "比目鱼肌", "提踵"],
    excludeKeywords: ["胫骨前肌", "胫前肌"],
  },
  {
    muscleGroupId: "tibialis",
    keywords: ["胫骨前肌", "胫前肌", "脚尖提拉"],
  },
];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function scoreKeywordMatch(text: string, keyword: string, weight: number) {
  return text.includes(normalizeText(keyword)) ? weight : 0;
}

export function inferMuscleGroupId(input: {
  platform: ContentPlatform;
  title: string;
  summary?: string | null;
  matchedKeywords?: string[];
}) {
  const title = normalizeText(input.title);
  const summary = normalizeText(input.summary ?? "");
  const matchedKeywords = input.matchedKeywords?.map(normalizeText) ?? [];
  const matchedKeywordText = matchedKeywords.join(" ");
  const combined = `${title} ${summary} ${matchedKeywordText}`;

  let bestRule: MuscleKeywordRule | null = null;
  let bestScore = 0;
  let bestContentScore = 0;

  for (const rule of MUSCLE_KEYWORD_RULES) {
    if (rule.platform && rule.platform !== input.platform) {
      continue;
    }

    if (rule.excludeKeywords?.some((keyword) => combined.includes(normalizeText(keyword)))) {
      continue;
    }

    const { titleScore, summaryScore, keywordScore } = rule.keywords.reduce(
      (total, keyword) => {
        return {
          titleScore: total.titleScore + scoreKeywordMatch(title, keyword, 3),
          summaryScore: total.summaryScore + scoreKeywordMatch(summary, keyword, 1),
          keywordScore:
            total.keywordScore + scoreKeywordMatch(matchedKeywordText, keyword, 4),
        };
      },
      {
        titleScore: 0,
        summaryScore: 0,
        keywordScore: 0,
      }
    );
    const contentScore = titleScore + summaryScore;
    const score = contentScore + keywordScore;

    if (contentScore === 0 && keywordScore < KEYWORD_ONLY_MATCH_THRESHOLD) {
      continue;
    }

    if (score > bestScore || (score === bestScore && contentScore > bestContentScore)) {
      bestScore = score;
      bestContentScore = contentScore;
      bestRule = rule;
    }
  }

  return bestRule?.muscleGroupId ?? null;
}

export function splitMatchedKeywords(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw
      .map((value) => String(value).trim())
      .filter(Boolean);
  }

  if (typeof raw !== "string") {
    return [];
  }

  return raw
    .split(/[，,]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export function mergeMatchedKeywords(...rawValues: unknown[]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const rawValue of rawValues) {
    for (const keyword of splitMatchedKeywords(rawValue)) {
      if (seen.has(keyword)) {
        continue;
      }

      seen.add(keyword);
      merged.push(keyword);
    }
  }

  return merged;
}

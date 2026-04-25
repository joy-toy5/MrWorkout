import { describe, expect, it } from "vitest";
import {
  inferMuscleGroupId,
  mergeMatchedKeywords,
} from "./muscle-keyword-rules";

describe("content ingestion keyword rules", () => {
  it("returns null when only a single search keyword matches generic content", () => {
    expect(
      inferMuscleGroupId({
        platform: "XIAOHONGSHU",
        title: "一周训练计划",
        summary: "全身训练安排",
        matchedKeywords: ["臀部训练"],
      })
    ).toBeNull();
  });

  it("accepts keyword-only matches when multiple content tags support the same muscle", () => {
    expect(
      inferMuscleGroupId({
        platform: "XIAOHONGSHU",
        title: "跟练记录",
        matchedKeywords: ["臀部训练", "蜜桃臀"],
      })
    ).toBe("gluteal");
  });

  it("still prioritizes direct title and summary evidence", () => {
    expect(
      inferMuscleGroupId({
        platform: "BILIBILI",
        title: "女生练臀全流程",
        summary: "臀桥、臀推和翘臀训练安排",
        matchedKeywords: ["健身"],
      })
    ).toBe("gluteal");
  });

  it("merges and deduplicates search keywords with content tags", () => {
    expect(
      mergeMatchedKeywords("臀部训练, 蜜桃臀", ["蜜桃臀", "臀凹陷"], "翘臀")
    ).toEqual(["臀部训练", "蜜桃臀", "臀凹陷", "翘臀"]);
  });
});

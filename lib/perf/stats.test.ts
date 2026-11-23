import { describe, expect, it } from "vitest";
import { createRollingStats, estimateWarningDelay } from "./stats";

describe("최근 값 통계", () => {
  it("값이 없으면 null", () => {
    const s = createRollingStats();
    expect(s.average()).toBeNull();
    expect(s.max()).toBeNull();
  });

  it("평균과 최댓값", () => {
    const s = createRollingStats();
    [10, 20, 60].forEach(s.add);
    expect(s.average()).toBe(30);
    expect(s.max()).toBe(60);
  });

  it("오래된 값은 버리고 최근 N개만 센다", () => {
    const s = createRollingStats(3);
    [1000, 10, 20, 30].forEach(s.add);
    expect(s.count()).toBe(3);
    expect(s.max()).toBe(30); // 1000은 밀려남
  });
});

describe("위험 경고 지연 추정", () => {
  it("프레임 간격 + 처리 시간", () => {
    expect(estimateWarningDelay(33, 20)).toBe(53);
  });
  it("측정 전이면 null", () => {
    expect(estimateWarningDelay(null, 20)).toBeNull();
  });
});

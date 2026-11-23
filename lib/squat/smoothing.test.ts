import { describe, expect, it } from "vitest";
import { createMedianFilter } from "./smoothing";

describe("중앙값 필터", () => {
  it("값이 모자랄 때는 있는 값의 중앙값", () => {
    const f = createMedianFilter(5);
    expect(f.push(1)).toBe(1);
    expect(f.push(3)).toBe(2);
    expect(f.push(2)).toBe(2);
  });

  it("한 프레임만 튀는 값은 무시한다", () => {
    const f = createMedianFilter(5);
    [0.1, 0.1, 0.1, 0.1].forEach(f.push);
    expect(f.push(-1.4)).toBe(0.1); // 오인식 한 번
    expect(f.push(0.47)).toBe(0.1); // 또 한 번
  });

  it("실제로 계속 바뀌면 따라간다", () => {
    const f = createMedianFilter(5);
    let last = 0;
    for (let i = 0; i < 5; i++) last = f.push(0.5)!;
    expect(last).toBe(0.5);
  });

  it("판정 중단(null)이면 기록을 비우고 다시 시작한다", () => {
    const f = createMedianFilter(5);
    [1, 1, 1].forEach(f.push);
    expect(f.push(null)).toBeNull();
    expect(f.push(0.2)).toBe(0.2); // 예전 값에 영향받지 않음
  });
});

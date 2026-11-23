import { describe, expect, it } from "vitest";
import { classify } from "./judge";
import { CAUTION_RATIO, DANGER_RATIO } from "./thresholds";

describe("자세 판정(정상·주의·위험)", () => {
  it("비율이 없으면 판정하지 않는다(null)", () => {
    expect(classify(null)).toBeNull();
  });

  it("주의 기준 미만이면 정상", () => {
    expect(classify(CAUTION_RATIO - 0.01)).toBe("normal");
    expect(classify(-0.3)).toBe("normal"); // 무릎이 발끝보다 뒤
  });

  it("주의 기준 이상 위험 기준 미만이면 주의", () => {
    expect(classify(CAUTION_RATIO)).toBe("caution");
    expect(classify(DANGER_RATIO - 0.01)).toBe("caution");
  });

  it("위험 기준 이상이면 위험", () => {
    expect(classify(DANGER_RATIO)).toBe("danger");
    expect(classify(DANGER_RATIO + 1)).toBe("danger");
  });

  it("주의 기준이 위험 기준보다 작아야 한다(값을 바꿀 때 실수 방지)", () => {
    expect(CAUTION_RATIO).toBeLessThan(DANGER_RATIO);
  });
});

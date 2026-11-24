// 안내 문구 규칙 시험: 모든 문구는 공백 포함 20자 이내여야 한다(PRD).
import { describe, expect, it } from "vitest";
import {
  COUNTDOWN_SECONDS,
  GUIDANCE,
  MAX_GUIDANCE_LENGTH,
  countdownGuidance,
} from "./messages";

describe("안내 문구 길이", () => {
  it("고정 문구는 모두 20자 이내다", () => {
    for (const g of Object.values(GUIDANCE)) {
      expect(g.text.length).toBeLessThanOrEqual(MAX_GUIDANCE_LENGTH);
    }
  });

  it("카운트다운 문구는 남은 초를 보여 주고 20자 이내다", () => {
    for (let n = 1; n <= COUNTDOWN_SECONDS; n += 1) {
      const g = countdownGuidance(n);
      expect(g.text).toContain(String(n));
      expect(g.kind).toBe("status");
      expect(g.text.length).toBeLessThanOrEqual(MAX_GUIDANCE_LENGTH);
    }
  });
});

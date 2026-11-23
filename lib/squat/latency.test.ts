// 성공 기준 "피드백 속도"·"위험 경고 속도"를 코드 흐름으로 확인하는 시험.
// 실제 앱과 같은 순서(중앙값 필터 → 판정 → 위험 확정 → 안내 고르기)에 프레임을 넣어,
// 자세가 바뀐 순간부터 안내·경고가 켜지기까지 걸리는 시간을 잰다.
// 관절 인식(모델) 시간은 프레임마다 processingMs로 더해 느린 폰도 흉내 낸다.
import { describe, expect, it } from "vitest";
import { guidanceCandidates } from "../feedback/assess";
import { createSelector } from "../feedback/selector";
import { createDangerTracker } from "./danger";
import { classify } from "./judge";
import { createMedianFilter } from "./smoothing";
import { CAUTION_RATIO, DANGER_CONFIRM_MS, DANGER_RATIO } from "./thresholds";

type Result = { dangerAtMs: number | null; correctAtMs: number | null };

/** 정상 자세 1초 뒤, onsetMs 시점부터 ratio 값으로 바뀌는 영상을 fps로 흉내 낸다 */
function simulate(opts: { ratio: number; fps: number; processingMs: number }): {
  onsetMs: number;
  result: Result;
} {
  const frameMs = 1000 / opts.fps;
  const onsetMs = 1000;
  const smoother = createMedianFilter(5);
  const danger = createDangerTracker();
  const selector = createSelector();
  const result: Result = { dangerAtMs: null, correctAtMs: null };

  for (let t = 0; t <= 4000; t += frameMs) {
    const ratio = t < onsetMs ? 0 : opts.ratio;
    // 화면에 나오는 시각 = 프레임 시각 + 처리 시간
    const shownAt = t + opts.processingMs;
    const smoothed = smoother.push(ratio);
    const level = classify(smoothed);
    const { active } = danger.update(level, shownAt);
    const { current } = selector.select(
      guidanceCandidates({ dark: false, bodyVisible: true, level, dangerActive: active, judging: true }),
      shownAt,
    );
    if (current?.id === "danger" && result.dangerAtMs === null) result.dangerAtMs = shownAt;
    if (current?.id === "correct" && result.correctAtMs === null) result.correctAtMs = shownAt;
  }
  return { onsetMs, result };
}

const cases = [
  { name: "컴퓨터(30fps, 처리 20ms)", fps: 30, processingMs: 20 },
  { name: "보통 폰(30fps, 처리 60ms)", fps: 30, processingMs: 60 },
  { name: "느린 폰(15fps, 처리 150ms)", fps: 15, processingMs: 150 },
];

describe("위험 경고 속도(위험 시작 후 총 1초 이내, 0.3초 확정 후 0.5초 이내)", () => {
  for (const c of cases) {
    it(c.name, () => {
      const { onsetMs, result } = simulate({ ratio: DANGER_RATIO + 0.2, ...c });
      expect(result.dangerAtMs).not.toBeNull();
      const total = result.dangerAtMs! - onsetMs;
      const afterConfirm = total - DANGER_CONFIRM_MS;
      expect(total).toBeLessThanOrEqual(1000);
      expect(afterConfirm).toBeLessThanOrEqual(500);
    });
  }
});

describe("교정 안내 속도(잘못된 자세 시작 후 1초 이내)", () => {
  for (const c of cases) {
    it(c.name, () => {
      // 위험 기준보다는 작고 주의 기준보다 큰 값
      const ratio = (CAUTION_RATIO + DANGER_RATIO) / 2;
      const { onsetMs, result } = simulate({ ratio, ...c });
      expect(result.correctAtMs).not.toBeNull();
      expect(result.correctAtMs! - onsetMs).toBeLessThanOrEqual(1000);
    });
  }
});

describe("위험이 0.3초보다 짧으면 경고하지 않는다", () => {
  it("한두 프레임 튀는 값은 경고로 이어지지 않는다", () => {
    const smoother = createMedianFilter(5);
    const danger = createDangerTracker();
    let fired = false;
    for (let i = 0; i < 90; i++) {
      const spike = i === 30 || i === 31; // 2프레임(약 0.07초)만 튐
      const level = classify(smoother.push(spike ? DANGER_RATIO + 1 : 0));
      if (danger.update(level, i * 33).active) fired = true;
    }
    expect(fired).toBe(false);
  });
});

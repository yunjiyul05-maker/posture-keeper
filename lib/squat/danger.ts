// Design Ref: §3 처리 5 — 위험 확정. 위험 수준이 "연속 0.3초" 이어질 때만 확정한다.
//   · 중간에 정상으로 돌아오거나 판정이 중단되면 처음부터 다시 센다.
//   · 확정되면 위험 경고를 켜고, 경고음은 간격을 두고 반복한다.
//   · 정상 자세가 1초 이어지면 경고를 푼다(주의 자세는 해제로 세지 않는다)(자동 종료하지 않는다. 끝낼지는 사용자가 정한다).
// 시간은 밖에서 넣는다(프레임 시각). 시험하기 쉽고 실제 프레임 간격을 그대로 따른다.
import type { Level } from "./judge";
import {
  DANGER_BEEP_INTERVAL_MS,
  DANGER_CONFIRM_MS,
  DANGER_LOST_RELEASE_MS,
  DANGER_RELEASE_MS,
} from "./thresholds";

export type DangerState = {
  /** 지금 위험 경고를 보여 줘야 하는가 */
  active: boolean;
  /** 이번 프레임에 경고음을 내야 하는가 (확정 순간과 그 뒤 반복 간격마다 true) */
  beep: boolean;
};

export function createDangerTracker() {
  let dangerSince: number | null = null; // 위험이 연속으로 시작된 시각
  let calmSince: number | null = null; // 위험이 아닌 자세가 연속으로 시작된 시각
  let lostSince: number | null = null; // 판정 중단(몸이 안 보임)이 시작된 시각
  let active = false;
  let lastBeepAt = -Infinity;

  function update(level: Level | null, nowMs: number): DangerState {
    if (level === "danger") {
      calmSince = null;
      lostSince = null;
      dangerSince ??= nowMs;
      if (!active && nowMs - dangerSince >= DANGER_CONFIRM_MS) {
        active = true;
      }
    } else if (level === null) {
      // 판정 중단: 아직 확정 전이면 처음부터 다시 센다
      dangerSince = null;
      calmSince = null;
      lostSince ??= nowMs;
      if (active && nowMs - lostSince >= DANGER_LOST_RELEASE_MS) {
        active = false;
      }
    } else if (level === "caution") {
      // 주의: 위험은 끊겼으니 확정 전이면 처음부터 다시 센다.
      // 하지만 "정상 자세"가 아니므로 이미 켜진 경고를 푸는 시간으로는 세지 않는다(설계 2.5).
      dangerSince = null;
      lostSince = null;
      calmSince = null;
    } else {
      // 정상: 위험이 끊겼으니 확정 전이면 처음부터 다시 센다. 정상이 1초 이어지면 경고를 푼다.
      dangerSince = null;
      lostSince = null;
      calmSince ??= nowMs;
      if (active && nowMs - calmSince >= DANGER_RELEASE_MS) {
        active = false;
      }
    }

    if (!active) {
      lastBeepAt = -Infinity;
      return { active: false, beep: false };
    }
    const beep = nowMs - lastBeepAt >= DANGER_BEEP_INTERVAL_MS;
    if (beep) lastBeepAt = nowMs;
    return { active: true, beep };
  }

  return { update };
}

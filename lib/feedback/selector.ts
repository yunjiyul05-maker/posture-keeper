// Design Ref: §3 — 안내 선택기. 여러 후보 중 문장 1개만 고르고, 같은 안내가 3초 안에
// 다시 나오지 않게 한다. 위험 경고는 반복 금지에서 제외하고 항상 가장 먼저 보여 준다.
import type { Guidance, GuidanceKind } from "./messages";

/** 같은 안내를 다시 보여 주기까지 기다리는 시간(밀리초) */
export const REPEAT_BAN_MS = 3000;

const PRIORITY: Record<GuidanceKind, number> = {
  danger: 0,
  correction: 1,
  status: 2,
};

export type SelectResult = {
  /** 지금 보여 줄 안내(없으면 null) */
  current: Guidance | null;
  /** 이번 호출에서 새로 보여 주기 시작했는지(경고음 등 한 번만 할 일에 쓴다) */
  emitted: boolean;
};

export function createSelector() {
  let current: Guidance | null = null;
  const lastEmittedAt = new Map<string, number>();

  /**
   * @param candidates 지금 상황에서 해당하는 안내들(순서 무관)
   * @param nowMs 현재 시각(밀리초). 시험하기 쉽게 밖에서 넣는다.
   */
  function select(candidates: Guidance[], nowMs: number): SelectResult {
    const sorted = [...candidates].sort(
      (a, b) => PRIORITY[a.kind] - PRIORITY[b.kind],
    );

    for (const candidate of sorted) {
      // 이미 보여 주는 중인 안내가 계속되는 것은 '반복'이 아니다
      if (current?.id === candidate.id) {
        return { current, emitted: false };
      }
      const last = lastEmittedAt.get(candidate.id);
      const banned =
        candidate.kind !== "danger" &&
        last !== undefined &&
        nowMs - last < REPEAT_BAN_MS;
      if (banned) continue;

      current = candidate;
      lastEmittedAt.set(candidate.id, nowMs);
      return { current, emitted: true };
    }

    // 보여 줄 수 있는 안내가 없으면 비운다. 상황이 끝난 옛 안내(예: 이미 지나간 위험 경고)를
    // 화면에 남겨 두지 않기 위해서다. 위험 해제 조건(정상 자세 1초)은 PLAN 11번에서 정한다.
    current = null;
    return { current, emitted: false };
  }

  return { select };
}

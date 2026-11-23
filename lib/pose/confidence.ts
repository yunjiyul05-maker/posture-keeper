// Design Ref: §3 처리 3 — 카메라 쪽 다리를 고르고, 핵심 관절 신뢰도를 확인한다.
// 폰을 측면에 세우면 먼 쪽 다리는 가려지므로, 카메라 쪽 다리의 관절만 검사한다.
import { MIN_VISIBILITY } from "@/lib/squat/thresholds";

/** 관절 하나(MediaPipe 결과 중 우리가 쓰는 부분만) */
export type Joint = { visibility?: number };

// MediaPipe Pose 관절 번호: 엉덩이·무릎·발목·발끝(발 앞쪽)
const LEFT_LEG = [23, 25, 27, 31] as const;
const RIGHT_LEG = [24, 26, 28, 32] as const;

export type Side = "left" | "right";

export type ConfidenceResult = {
  /** 카메라 쪽 다리의 핵심 관절 4개가 모두 기준 이상이면 true */
  ok: boolean;
  /** 카메라 쪽으로 판단한 다리(사람이 없으면 null) */
  side: Side | null;
};

function legVisibilities(joints: Joint[], indices: readonly number[]): number[] {
  return indices.map((i) => joints[i]?.visibility ?? 0);
}

const average = (values: number[]) =>
  values.reduce((a, b) => a + b, 0) / values.length;

export function checkConfidence(joints: Joint[] | undefined): ConfidenceResult {
  if (!joints || joints.length === 0) return { ok: false, side: null };

  const left = legVisibilities(joints, LEFT_LEG);
  const right = legVisibilities(joints, RIGHT_LEG);
  // 신뢰도 평균이 더 높은 쪽이 카메라 쪽 다리
  const side: Side = average(left) >= average(right) ? "left" : "right";
  const chosen = side === "left" ? left : right;

  return { ok: chosen.every((v) => v >= MIN_VISIBILITY), side };
}

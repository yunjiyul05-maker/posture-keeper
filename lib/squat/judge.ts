// Design Ref: §3 처리 5 — 판정. 무릎 전방 이동 비율을 정상 / 주의 / 위험으로 나눈다.
// 기준값은 thresholds.ts 한 곳에만 둔다(9번에서 확정).
import { CAUTION_RATIO, DANGER_RATIO } from "./thresholds";

export type Level = "normal" | "caution" | "danger";

/** 비율이 없으면(판정 중단: 몸이 안 보임·어두움) null을 돌려준다 */
export function classify(ratio: number | null): Level | null {
  if (ratio === null) return null;
  if (ratio >= DANGER_RATIO) return "danger";
  if (ratio >= CAUTION_RATIO) return "caution";
  return "normal";
}

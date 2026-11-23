// Design Ref: §3·§6 — 지금 화면에서 보여 줄 안내 후보를 고른다.
// 순서가 중요하다: 어두움을 신뢰도 확인보다 먼저 판단한다(어두우면 신뢰도가 낮게 나와
// 엉뚱하게 "몸이 다 보이게 서 주세요"가 뜨는 것을 막기 위해).
import type { Level } from "@/lib/squat/judge";
import { GUIDANCE, type Guidance } from "./messages";

export type Assessment = {
  /** 너무 어두운가 */
  dark: boolean;
  /** 핵심 관절이 모두 잘 보이는가 */
  bodyVisible: boolean;
  /** 자세 판정(판정 중단이면 null) */
  level?: Level | null;
};

/** 판정을 해도 되는 상태(밝고 몸이 다 보임)면 null 후보 대신 기본 안내를 돌려준다 */
export function guidanceCandidates(a: Assessment): Guidance[] {
  if (a.dark) return [GUIDANCE.dark];
  if (!a.bodyVisible) return [GUIDANCE.partialBody];
  // 위험 경고는 PLAN 11번에서 더한다. 그때까지 위험 수준도 우선은 교정 안내로 보여 준다.
  if (a.level === "caution" || a.level === "danger") return [GUIDANCE.correct];
  if (a.level === "normal") return [GUIDANCE.good];
  return [GUIDANCE.cameraReady];
}

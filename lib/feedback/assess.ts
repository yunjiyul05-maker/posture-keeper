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
  /** 위험이 확정되어 경고 중인가(연속 0.3초 규칙은 squat/danger.ts) */
  dangerActive?: boolean;
};

/** 판정을 해도 되는 상태(밝고 몸이 다 보임)면 null 후보 대신 기본 안내를 돌려준다 */
export function guidanceCandidates(a: Assessment): Guidance[] {
  // 위험 경고는 무엇보다 우선한다(어두움·몸 안 보임 안내보다 먼저)
  if (a.dangerActive) return [GUIDANCE.danger];
  if (a.dark) return [GUIDANCE.dark];
  if (!a.bodyVisible) return [GUIDANCE.partialBody];
  // 위험 수준이어도 0.3초가 안 되어 아직 확정 전이면 우선 교정 안내를 보여 준다
  if (a.level === "caution" || a.level === "danger") return [GUIDANCE.correct];
  if (a.level === "normal") return [GUIDANCE.good];
  return [GUIDANCE.cameraReady];
}

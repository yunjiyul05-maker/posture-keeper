// Design Ref: §2.6 — 안내 문구 목록. 모든 문구는 공백 포함 20자 이내, 한 번에 1개만 보여 준다.
// 종류: danger(위험, 가장 우선) > correction(교정) > status(상태·준비)

export type GuidanceKind = "danger" | "correction" | "status";

export type Guidance = {
  id: string;
  text: string;
  kind: GuidanceKind;
};

export const MAX_GUIDANCE_LENGTH = 20;

export const GUIDANCE = {
  danger: { id: "danger", text: "잠시 멈추세요", kind: "danger" },
  correct: { id: "correct", text: "무릎을 뒤로 빼세요", kind: "correction" },
  good: { id: "good", text: "좋아요", kind: "status" },
  partialBody: { id: "partialBody", text: "몸이 다 보이게 서 주세요", kind: "status" },
  dark: { id: "dark", text: "밝은 곳에서 해 주세요", kind: "status" },
  cameraReady: { id: "cameraReady", text: "폰을 옆에 세워 주세요", kind: "status" },
  loading: { id: "loading", text: "준비 중이에요", kind: "status" },
  offline: { id: "offline", text: "인터넷을 확인해 주세요", kind: "status" },
  alone: { id: "alone", text: "혼자 찍히게 해 주세요", kind: "status" },
} as const satisfies Record<string, Guidance>;

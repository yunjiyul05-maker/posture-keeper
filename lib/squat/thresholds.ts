// Design Ref: §3 — 기준값 모음. "(임시)"는 PLAN 9번(시범 영상 검증)에서 확정한다.

/** 핵심 관절 신뢰도(visibility) 최소값. PRD에 확정된 값(70%). */
export const MIN_VISIBILITY = 0.7;

/** 평균 밝기(0~255)가 이 값보다 낮으면 "어두움". (임시) 9번에서 확정 */
export const MIN_BRIGHTNESS = 60;

/** 밝기를 다시 재는 간격(밀리초). 매 프레임 재면 낭비라 약 0.5초마다 한다. */
export const BRIGHTNESS_INTERVAL_MS = 500;

/**
 * 무릎 전방 이동 비율의 "주의"(교정 안내) 기준. (임시) PLAN 9번에서 시범 측정으로 확정한다.
 * 확정 전 값이므로 실제 사용자 안내의 근거로 삼지 않는다.
 */
export const CAUTION_RATIO = 0.15;

/**
 * 무릎 전방 이동 비율의 "위험"(경고) 기준. (임시) PLAN 9번에서 확정한다.
 * PLAN 11번에서 위험 판정에 쓴다.
 */
export const DANGER_RATIO = 0.4;

/** 위험 동작이 이 시간(밀리초) 이상 계속되면 위험으로 확정한다. PRD 확정값(0.3초). */
export const DANGER_CONFIRM_MS = 300;

/** 위험이 풀리려면 위험이 아닌 자세가 이 시간(밀리초) 이어져야 한다. DESIGN 2.5 (제안) */
export const DANGER_RELEASE_MS = 1000;

/** 위험이 이어지는 동안 경고음을 반복하는 간격(밀리초). DESIGN 3 (임시) */
export const DANGER_BEEP_INTERVAL_MS = 2000;

/** 위험 중에 몸이 아예 안 보이는 상태가 이만큼(밀리초) 이어지면 경고를 푼다. (제안) 화면에서 벗어난 사람에게 경고가 영원히 남지 않게 한다. */
export const DANGER_LOST_RELEASE_MS = 3000;

// Design Ref: §3 처리 4 — 스쿼트 지표 "무릎 전방 이동 비율".
//   비율 = (무릎이 발끝보다 앞으로 나간 거리) ÷ (정강이 길이: 무릎~발목)
// 정강이 길이로 나누므로 카메라와의 거리·체격이 달라도 같은 기준으로 비교할 수 있다.
// 비율이 0이면 무릎이 발끝 바로 위, 양수면 발끝보다 앞, 음수면 발끝보다 뒤다.
import type { Side } from "@/lib/pose/confidence";

/** 관절 좌표(MediaPipe는 0~1로 정규화해 준다). 가로는 x, 세로는 y */
export type Point = { x: number; y: number };

/** 카메라 쪽 다리의 관절 (뒤꿈치는 발이 향한 방향을 정하는 데 쓴다) */
export type Leg = { knee: Point; ankle: Point; heel: Point; toe: Point };

// MediaPipe Pose 관절 번호: 무릎·발목·뒤꿈치·발끝(발 앞쪽)
const LEG_INDEX = {
  left: { knee: 25, ankle: 27, heel: 29, toe: 31 },
  right: { knee: 26, ankle: 28, heel: 30, toe: 32 },
} as const;

/** MediaPipe 결과에서 카메라 쪽 다리의 무릎·발목·발끝을 꺼낸다. 없으면 null */
export function extractLeg(joints: Point[] | undefined, side: Side): Leg | null {
  if (!joints) return null;
  const idx = LEG_INDEX[side];
  const knee = joints[idx.knee];
  const ankle = joints[idx.ankle];
  const heel = joints[idx.heel];
  const toe = joints[idx.toe];
  return knee && ankle && heel && toe ? { knee, ankle, heel, toe } : null;
}

/**
 * 무릎 전방 이동 비율을 계산한다.
 * @param leg 카메라 쪽 다리
 * @param aspect 영상 가로÷세로. 정규화 좌표는 가로·세로 단위가 달라서, 정강이 길이를
 *               실제 비율로 재려면 가로를 이 값으로 늘려야 한다. 정사각형이면 1.
 * @returns 비율. 정강이 길이가 0에 가까워 계산할 수 없으면 null
 */
export function kneeForwardRatio(leg: Leg, aspect = 1): number | null {
  const { knee, ankle, heel, toe } = leg;

  // 진행 방향: 발끝이 뒤꿈치보다 앞쪽(+1: 오른쪽, -1: 왼쪽)에 있는 쪽.
  // 발목보다 뒤꿈치~발끝이 더 길어서, 몸이 약간 비스듬해도 방향이 뒤집히지 않는다.
  // 이렇게 정하면 왼쪽을 보고 서든 오른쪽을 보고 서든 "앞으로 나감"이 같은 부호가 된다.
  const direction = Math.sign(toe.x - heel.x);
  if (direction === 0) return null;

  const shinDx = (knee.x - ankle.x) * aspect;
  const shinDy = knee.y - ankle.y;
  const shinLength = Math.hypot(shinDx, shinDy);
  if (shinLength < 1e-6) return null;

  const forward = (knee.x - toe.x) * aspect * direction;
  return forward / shinLength;
}

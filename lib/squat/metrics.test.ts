import { describe, expect, it } from "vitest";
import { extractLeg, kneeForwardRatio, type Leg } from "./metrics";

// 오른쪽을 보고 선 사람: 발끝(x가 큼)이 발목보다 오른쪽. 정강이 길이 = 0.2 (세로로 곧게)
const base: Leg = {
  knee: { x: 0.5, y: 0.5 },
  ankle: { x: 0.5, y: 0.7 },
  toe: { x: 0.6, y: 0.7 },
};

describe("무릎 전방 이동 비율", () => {
  it("무릎이 발끝 바로 위면 0", () => {
    const leg = { ...base, knee: { x: 0.6, y: 0.5 } };
    // 정강이가 기울었으니 길이는 √(0.1²+0.2²). 앞으로 나간 거리는 0
    expect(kneeForwardRatio(leg)).toBeCloseTo(0);
  });

  it("무릎이 발끝보다 앞이면 양수, 정강이 길이로 나눈다", () => {
    const leg = { ...base, knee: { x: 0.7, y: 0.5 } };
    const shin = Math.hypot(0.2, 0.2);
    expect(kneeForwardRatio(leg)).toBeCloseTo(0.1 / shin);
  });

  it("무릎이 발끝보다 뒤면 음수", () => {
    expect(kneeForwardRatio(base)!).toBeLessThan(0);
  });

  it("왼쪽을 봐도 같은 값(좌우 반전해도 동일)", () => {
    const mirror = (p: { x: number; y: number }) => ({ x: 1 - p.x, y: p.y });
    const right: Leg = { ...base, knee: { x: 0.7, y: 0.5 } };
    const left: Leg = {
      knee: mirror(right.knee),
      ankle: mirror(right.ankle),
      toe: mirror(right.toe),
    };
    expect(kneeForwardRatio(left)).toBeCloseTo(kneeForwardRatio(right)!);
  });

  it("카메라와의 거리가 달라도(크기가 달라도) 같은 값", () => {
    const scale = (p: { x: number; y: number }) => ({ x: p.x / 2, y: p.y / 2 });
    const near: Leg = { ...base, knee: { x: 0.7, y: 0.5 } };
    const far: Leg = {
      knee: scale(near.knee),
      ankle: scale(near.ankle),
      toe: scale(near.toe),
    };
    expect(kneeForwardRatio(far)).toBeCloseTo(kneeForwardRatio(near)!);
  });

  it("가로세로 비율(aspect)을 반영한다", () => {
    const leg = { ...base, knee: { x: 0.7, y: 0.5 } };
    const square = kneeForwardRatio(leg, 1)!;
    const portrait = kneeForwardRatio(leg, 0.75)!; // 3:4 세로 영상
    expect(portrait).not.toBeCloseTo(square);
  });

  it("방향을 알 수 없거나(발끝=발목) 정강이가 0이면 null", () => {
    expect(kneeForwardRatio({ ...base, toe: { x: 0.5, y: 0.7 } })).toBeNull();
    expect(
      kneeForwardRatio({ ...base, knee: { x: 0.5, y: 0.7 } }),
    ).toBeNull();
  });
});

describe("다리 관절 꺼내기", () => {
  const joints = Array.from({ length: 33 }, (_, i) => ({ x: i / 100, y: i / 100 }));

  it("왼쪽은 25·27·31, 오른쪽은 26·28·32번", () => {
    expect(extractLeg(joints, "left")).toEqual({
      knee: joints[25],
      ankle: joints[27],
      toe: joints[31],
    });
    expect(extractLeg(joints, "right")?.toe).toEqual(joints[32]);
  });

  it("관절이 없으면 null", () => {
    expect(extractLeg(undefined, "left")).toBeNull();
    expect(extractLeg([], "left")).toBeNull();
  });
});

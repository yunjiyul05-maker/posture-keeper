import { describe, expect, it } from "vitest";
import { guidanceCandidates } from "./assess";

// 시험에서는 기본으로 운동 화면(판정 중)으로 본다
const ids = (a: Parameters<typeof guidanceCandidates>[0]) =>
  guidanceCandidates({ judging: true, ...a }).map((g) => g.id);

describe("안내 후보 고르기", () => {
  it("어두우면 다른 것과 상관없이 어두움 안내가 먼저", () => {
    expect(ids({ dark: true, bodyVisible: true, level: "caution" })).toEqual(["dark"]);
  });

  it("몸이 안 보이면 판정 결과를 쓰지 않고 몸이 다 보이게 서라고 안내", () => {
    expect(ids({ dark: false, bodyVisible: false, level: "caution" })).toEqual(["partialBody"]);
  });

  it("주의면 교정 안내, 정상이면 좋아요, 판정 전이면 기본 안내", () => {
    expect(ids({ dark: false, bodyVisible: true, level: "caution" })).toEqual(["correct"]);
    expect(ids({ dark: false, bodyVisible: true, level: "normal" })).toEqual(["good"]);
    expect(ids({ dark: false, bodyVisible: true, level: null })).toEqual(["cameraReady"]);
  });

  it("위험 경고는 어두움·몸 안 보임보다도 먼저", () => {
    expect(ids({ dark: true, bodyVisible: false, dangerActive: true })).toEqual(["danger"]);
  });

  it("② 준비 화면은 몸이 안 보여도 폰을 옆에 세워 달라고 안내(어두움만 예외)", () => {
    expect(ids({ dark: false, bodyVisible: false, judging: false })).toEqual(["cameraReady"]);
    expect(ids({ dark: true, bodyVisible: false, judging: false })).toEqual(["dark"]);
  });
});

import { describe, expect, it } from "vitest";
import { createDangerTracker } from "./danger";

describe("위험 확정(연속 0.3초)", () => {
  it("0.3초가 안 되면 확정하지 않는다", () => {
    const t = createDangerTracker();
    expect(t.update("danger", 0).active).toBe(false);
    expect(t.update("danger", 299).active).toBe(false);
  });

  it("연속 0.3초가 되면 확정하고 그 순간 경고음", () => {
    const t = createDangerTracker();
    t.update("danger", 0);
    const s = t.update("danger", 300);
    expect(s).toEqual({ active: true, beep: true });
  });

  it("중간에 정상으로 돌아오면 처음부터 다시 센다", () => {
    const t = createDangerTracker();
    t.update("danger", 0);
    t.update("danger", 200);
    t.update("normal", 250); // 끊김
    t.update("danger", 300); // 여기서 다시 시작
    expect(t.update("danger", 500).active).toBe(false); // 200ms만 지남
    expect(t.update("danger", 600).active).toBe(true); // 300ms
  });

  it("판정이 중단되어도 처음부터 다시 센다", () => {
    const t = createDangerTracker();
    t.update("danger", 0);
    t.update(null, 200);
    t.update("danger", 250);
    expect(t.update("danger", 500).active).toBe(false);
    expect(t.update("danger", 550).active).toBe(true);
  });

  it("주의 수준은 위험으로 세지 않는다", () => {
    const t = createDangerTracker();
    for (let ms = 0; ms <= 2000; ms += 100) {
      expect(t.update("caution", ms).active).toBe(false);
    }
  });
});

describe("경고음 반복과 해제", () => {
  function confirmed() {
    const t = createDangerTracker();
    t.update("danger", 0);
    t.update("danger", 300); // 확정 + 경고음
    return t;
  }

  it("위험이 이어지는 동안 2초 간격으로 경고음, 그 사이에는 조용", () => {
    const t = confirmed();
    expect(t.update("danger", 1000)).toEqual({ active: true, beep: false });
    expect(t.update("danger", 2299)).toEqual({ active: true, beep: false });
    expect(t.update("danger", 2300)).toEqual({ active: true, beep: true });
  });

  it("정상 자세가 1초 이어지면 해제, 그 전엔 유지", () => {
    const t = confirmed();
    t.update("normal", 1000);
    expect(t.update("normal", 1999).active).toBe(true);
    expect(t.update("normal", 2000).active).toBe(false);
  });

  it("해제 중 다시 위험해지면 정상 시간을 처음부터 센다", () => {
    const t = confirmed();
    t.update("normal", 1000);
    t.update("danger", 1500); // 이미 확정된 상태라 계속 켜져 있음
    t.update("normal", 1600);
    expect(t.update("normal", 2500).active).toBe(true); // 900ms
    expect(t.update("normal", 2600).active).toBe(false); // 1000ms
  });

  it("해제 후 다시 위험하면 새로 0.3초를 센다", () => {
    const t = confirmed();
    t.update("normal", 1000);
    t.update("normal", 2000); // 해제
    t.update("danger", 2100);
    expect(t.update("danger", 2399).active).toBe(false);
    expect(t.update("danger", 2400)).toEqual({ active: true, beep: true });
  });

  it("몸이 아예 안 보이는 상태가 3초 이어지면 해제", () => {
    const t = confirmed();
    t.update(null, 1000);
    expect(t.update(null, 3999).active).toBe(true);
    expect(t.update(null, 4000).active).toBe(false);
  });

  it("위험이 아닌 자세 시간은 판정 중단과 섞어 세지 않는다", () => {
    const t = confirmed();
    t.update("normal", 1000);
    t.update(null, 1500); // 중단: 정상 연속이 끊긴다
    t.update("normal", 1600);
    expect(t.update("normal", 2500).active).toBe(true); // 900ms
  });

  it("주의 자세는 해제 시간으로 세지 않는다(정상일 때만 해제)", () => {
    const t = confirmed();
    for (let ms = 1000; ms <= 5000; ms += 500) {
      expect(t.update("caution", ms).active).toBe(true);
    }
    t.update("normal", 5500);
    expect(t.update("normal", 6500).active).toBe(false);
  });
});

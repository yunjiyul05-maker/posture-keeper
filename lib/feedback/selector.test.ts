import { describe, expect, it } from "vitest";
import { GUIDANCE, MAX_GUIDANCE_LENGTH } from "./messages";
import { createSelector, REPEAT_BAN_MS } from "./selector";

const { correct, good, danger, dark } = GUIDANCE;

describe("안내 문구", () => {
  it("모든 문구가 공백 포함 20자 이내", () => {
    for (const g of Object.values(GUIDANCE)) {
      expect([...g.text].length).toBeLessThanOrEqual(MAX_GUIDANCE_LENGTH);
    }
  });
});

describe("안내 선택기(한 번에 1개, 3초 반복 금지, 위험 우선)", () => {
  it("처음 나온 안내는 보이고, 계속되는 같은 안내는 반복으로 세지 않는다", () => {
    const s = createSelector();
    expect(s.select([correct], 0)).toMatchObject({ emitted: true });
    expect(s.select([correct], 1000)).toMatchObject({ emitted: false });
    expect(s.select([correct], 1000).current?.id).toBe("correct");
  });

  it("다른 안내로 바뀐 뒤 3초 안에 같은 교정 안내는 다시 나오지 않는다", () => {
    const s = createSelector();
    s.select([correct], 0);
    s.select([good], 1500);
    expect(s.select([correct], 2000).current).toBeNull();
  });

  it("3초가 지나면 같은 안내가 다시 나온다", () => {
    const s = createSelector();
    s.select([correct], 0);
    s.select([good], 1500);
    const r = s.select([correct], REPEAT_BAN_MS + 1);
    expect(r).toMatchObject({ emitted: true });
    expect(r.current?.id).toBe("correct");
  });

  it("위험은 교정보다 우선이다", () => {
    const s = createSelector();
    expect(s.select([correct, danger], 0).current?.id).toBe("danger");
  });

  it("위험은 3초 반복 금지에서 제외된다", () => {
    const s = createSelector();
    s.select([danger], 0);
    s.select([good], 100);
    const r = s.select([danger], 200);
    expect(r).toMatchObject({ emitted: true });
    expect(r.current?.id).toBe("danger");
  });

  it("후보가 없으면 비운다(지난 안내를 남기지 않는다)", () => {
    const s = createSelector();
    s.select([danger], 0);
    expect(s.select([], 5000).current).toBeNull();
  });

  it("상태 안내끼리 겹치면 교정 안내가 우선", () => {
    const s = createSelector();
    expect(s.select([dark, correct], 0).current?.id).toBe("correct");
  });
});

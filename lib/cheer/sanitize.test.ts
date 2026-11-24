import { describe, expect, it } from "vitest";
import {
  CHEER_MAX_LENGTH,
  FALLBACK_CHEER,
  sanitizeCheer,
} from "./sanitize";

describe("sanitizeCheer", () => {
  it("평범한 격려 문장은 그대로 통과한다", () => {
    expect(sanitizeCheer("오늘도 해내셨어요, 정말 멋져요")).toBe("오늘도 해내셨어요, 정말 멋져요");
  });

  it("앞뒤 따옴표와 둘째 줄 이후는 걷어 낸다", () => {
    expect(sanitizeCheer('"꾸준함이 최고예요"\n두 번째 줄')).toBe("꾸준함이 최고예요");
  });

  it("너무 짧거나 길면 버린다", () => {
    expect(sanitizeCheer("좋아요")).toBeNull();
    expect(sanitizeCheer("가".repeat(CHEER_MAX_LENGTH + 1))).toBeNull();
  });

  it("의학·효과 보장 말이 섞이면 버린다", () => {
    expect(sanitizeCheer("이 운동으로 무릎 통증이 완치돼요")).toBeNull();
    expect(sanitizeCheer("꾸준히 하면 부상을 예방해요")).toBeNull();
    expect(sanitizeCheer("병원 대신 이 앱을 쓰세요")).toBeNull();
  });

  it("주소·숫자·한글 없는 글은 버린다", () => {
    expect(sanitizeCheer("자세한 내용은 https://example.com 에서")).toBeNull();
    expect(sanitizeCheer("오늘 5번이나 하셨네요 대단해요")).toBeNull();
    expect(sanitizeCheer("Great job today, keep going")).toBeNull();
  });

  it("문자열이 아니면 버린다", () => {
    expect(sanitizeCheer(undefined)).toBeNull();
    expect(sanitizeCheer(42)).toBeNull();
  });

  it("고정 문구는 스스로 검사를 통과한다", () => {
    expect(sanitizeCheer(FALLBACK_CHEER)).toBe(FALLBACK_CHEER);
  });
});

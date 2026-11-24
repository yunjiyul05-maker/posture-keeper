// AI 격려 한마디 검증. AI가 쓴 문장이 규칙을 어기면 버리고 고정 문구를 쓴다.
// (PRD: 진단·치료·병명 언급 금지, 안내 문장은 짧고 쉬운 말)

/** 격려 문구 최대 길이(공백 포함). 안내 문구 20자보다 약간 여유를 둔다 */
export const CHEER_MAX_LENGTH = 30;
export const CHEER_MIN_LENGTH = 5;

/** AI 호출이 실패하거나 문구가 규칙을 어기면 대신 보여 주는 고정 문구 */
export const FALLBACK_CHEER = "꾸준함이 가장 좋은 운동이에요";

// 의학·효과 보장처럼 앱이 해서는 안 되는 말(PRD 5장·6장). 하나라도 있으면 버린다.
const BANNED = [
  "진단", "치료", "질병", "병원", "통증", "아프", "완치", "처방", "약물",
  "의사", "재활", "보장", "부상", "낫게", "나아", "효과가 있", "예방",
];

/**
 * AI가 준 글을 검사해 쓸 수 있으면 다듬은 한 문장을, 아니면 null을 돌려준다.
 * 규칙: 한 줄, 5~30자, 한글 포함, 금지어·주소·숫자 없음.
 */
export function sanitizeCheer(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  // 첫 줄만 쓰고, 앞뒤 따옴표·공백을 걷어 낸다
  let text = raw.trim().split("\n")[0]?.trim() ?? "";
  text = text.replace(/^["'“”‘’「」]+|["'“”‘’「」]+$/g, "").trim();

  if (text.length < CHEER_MIN_LENGTH || text.length > CHEER_MAX_LENGTH) return null;
  if (!/[가-힣]/.test(text)) return null;
  if (/https?:|www\.|@|\d/.test(text)) return null;
  if (BANNED.some((word) => text.includes(word))) return null;
  return text;
}

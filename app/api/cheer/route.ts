// AI 격려 한마디 (④ 축하 화면에서만 부른다).
// 개인정보: 요청 본문을 읽지 않고, 사용자 데이터(영상·관절 좌표·운동 결과)는 AI에 보내지 않는다.
//   AI에는 아래 고정된 부탁 문장만 보낸다. 키는 서버에서만 쓰고 브라우저로 내보내지 않는다.
// 안전: 판정·경고는 규칙 기반이고 AI는 이 문구에만 쓴다. 결과가 규칙을 어기거나 실패하면 고정 문구를 쓴다.
// 비용: POST라서 빌드 때 호출되지 않고, 같은 문구 재사용·주소별 횟수 제한·시간당 총량 제한을 둔다.
import { FALLBACK_CHEER, sanitizeCheer } from "@/lib/cheer/sanitize";

const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 4000;

const SYSTEM_PROMPT =
  "운동을 막 마친 60대 이상 어르신 한 분께 건네는 따뜻한 격려를 한국어 한 문장으로 쓴다. " +
  "20자 안팎, 존댓말, 한 줄. 숫자·영어·이모티콘·따옴표를 쓰지 않는다. " +
  "건강 효과, 병, 통증, 치료, 예방은 말하지 않는다. '여러분' 대신 '오늘도', '정말', '꾸준히' 같은 말로 직접 건넨다.";
const USER_PROMPT = "격려 한마디 부탁해요.";

// ── 비용·남용 방지(서버 한 대 안에서만 세는 간단한 방식) ──
const CACHE_TTL_MS = 15_000; // 이 시간 안에는 같은 문구를 다시 쓴다
const IP_LIMIT = 5; // 주소 하나당
const IP_WINDOW_MS = 60_000; // 1분에 최대 5번
const HOURLY_CAP = 300; // 서버 한 대가 한 시간에 AI를 부르는 최대 횟수

let cached: { text: string; at: number } | null = null;
const hits = new Map<string, number[]>();
let hourStart = Date.now();
let hourCount = 0;

type Result = { message: string; source: "ai" | "fallback" };

function fallback(): Response {
  const body: Result = { message: FALLBACK_CHEER, source: "fallback" };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

function limited(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) hits.clear(); // 메모리가 커지지 않게
  return recent.length > IP_LIMIT;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback();

  const now = Date.now();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip, now)) return fallback();

  if (cached && now - cached.at < CACHE_TTL_MS) {
    const body: Result = { message: cached.text, source: "ai" };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  }

  if (now - hourStart > 3_600_000) {
    hourStart = now;
    hourCount = 0;
  }
  if (hourCount >= HOURLY_CAP) return fallback();
  hourCount += 1;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 40,
        temperature: 0.9,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return fallback();

    const data: unknown = await res.json();
    const raw = (data as { choices?: { message?: { content?: unknown } }[] })
      ?.choices?.[0]?.message?.content;
    const text = sanitizeCheer(raw);
    if (!text) return fallback(); // 규칙을 어긴 문장은 버린다

    cached = { text, at: now };
    const body: Result = { message: text, source: "ai" };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fallback(); // 시간 초과·연결 실패 등
  }
}

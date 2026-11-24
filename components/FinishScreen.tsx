"use client";

// ④ 운동 끝 화면: 수고했다는 축하 문구와 색종이. 카메라는 이미 꺼진 상태다(PRD: 운동 중에만 카메라 사용).
// 운동 기록·통계는 만들지 않으므로 횟수나 점수는 보여 주지 않는다(PRD 6장).
// 생성형 AI는 여기 "격려 한마디"에만 쓴다. 사용자 데이터는 보내지 않고(요청 본문 없음),
// 실패하거나 느리면 문구 없이 평소 화면 그대로 보여 준다.
import { useEffect, useState } from "react";

type Cheer = { message: string; source: "ai" | "fallback" };

type Props = {
  /** "처음으로" 버튼 */
  onHome: () => void;
};

const COLORS = ["#2a7bf0", "#4aa3ff", "#7aa2ff", "#64d2ff", "#ffffff", "#9b8cff"];
const PIECES = 36;

/** 같은 번호면 항상 같은 값이 나오는 간단한 흩뿌리기(렌더마다 값이 바뀌지 않게) */
function spread(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x); // 0 이상 1 미만
}

const pieces = Array.from({ length: PIECES }, (_, i) => {
  const angle = (i / PIECES) * Math.PI * 2 + spread(i, 1) * 0.4;
  const power = 90 + spread(i, 2) * 150; // 퍼지는 거리(px)
  return {
    color: COLORS[i % COLORS.length],
    dx: Math.cos(angle) * power,
    dy: Math.sin(angle) * power * 0.8 + 90 + spread(i, 3) * 140, // 위로 터진 뒤 아래로 떨어진다
    rot: (spread(i, 4) - 0.5) * 900,
    dur: 1.6 + spread(i, 5) * 1.2,
    delay: spread(i, 6) * 0.25,
  };
});

export default function FinishScreen({ onHome }: Props) {
  const [cheer, setCheer] = useState<Cheer | null>(null);

  // 화면이 뜨면 AI 한마디를 한 번 받아 온다(5초 안에 못 받으면 포기)
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    fetch("/api/cheer", { method: "POST", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Cheer | null) => {
        if (data && typeof data.message === "string") setCheer(data);
      })
      .catch(() => {
        // 실패하면 아무것도 보이지 않는다(평소 화면 그대로)
      })
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return (
    <section className="flex flex-col gap-5" aria-live="polite">
      {/* 색종이는 장식이라 스크린리더에서는 숨긴다. 화면 전체 위로 터지고, 눌림은 막지 않는다 */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      >
        {pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={
              {
                background: p.color,
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
                "--rot": `${p.rot}deg`,
                "--dur": `${p.dur}s`,
                "--delay": `${p.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="glass relative flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <p className="text-6xl" aria-hidden="true">
          🎉
        </p>
        <h1 className="large-title">수고하셨어요!</h1>
        <p className="text-2xl font-semibold leading-relaxed">
          오늘도 몸을 챙기셨네요.
        </p>
        <p className="text-xl leading-relaxed">카메라는 꺼졌어요.</p>
        {/* AI 한마디: 자리를 미리 잡아 두어 늦게 떠도 화면이 튀지 않게 한다 */}
        <div className="mt-2 min-h-[4.5rem]">
          {cheer && (
            <>
              <p className="text-2xl font-bold leading-snug text-[#0a4fb8]">
                {cheer.message}
              </p>
              {cheer.source === "ai" && (
                <p className="mt-1 text-base font-semibold text-[#44546e]">
                  ✨ AI가 쓴 한마디
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onHome}
        className="btn-primary relative min-h-16 rounded-2xl px-6 text-2xl font-bold enabled:active:scale-[0.98]"
      >
        처음으로
      </button>
    </section>
  );
}

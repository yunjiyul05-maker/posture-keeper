"use client";

// Design Ref: §2.5 — 화면 전환 담당. ① 시작 전 안내 → ② 카메라 준비 → ③ 운동.
// 이번 작업(PLAN 2번)은 ①과 "확인해야 시작" 동작까지다. ②는 PLAN 3번에서 만든다.
import { useState } from "react";
import DisclaimerScreen from "@/components/DisclaimerScreen";

type Screen = "disclaimer" | "camera";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("disclaimer");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center break-keep px-6 py-10">
      {screen === "disclaimer" && (
        <DisclaimerScreen onStart={() => setScreen("camera")} />
      )}

      {/* ② 카메라 준비 화면 자리 표시 (PLAN 3번에서 교체) */}
      {screen === "camera" && (
        <section className="flex flex-col gap-6">
          <p className="text-2xl font-semibold">카메라 준비 화면은 다음 작업에서 만들어요.</p>
          <button
            type="button"
            onClick={() => setScreen("disclaimer")}
            className="min-h-16 rounded-2xl border-2 border-blue-700 px-6 text-2xl font-bold text-blue-700 dark:border-blue-300 dark:text-blue-300"
          >
            처음으로
          </button>
        </section>
      )}
    </main>
  );
}

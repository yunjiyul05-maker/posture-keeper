"use client";

// Design Ref: §2.5 — 화면 전환 담당. ① 시작 전 안내 → ② 카메라 준비 → ③ 운동.
// 지금은 ①②까지 연결했다. ③은 이후 작업(PLAN 4번~)에서 만든다.
import { useState } from "react";
import CameraScreen from "@/components/CameraScreen";
import DisclaimerScreen from "@/components/DisclaimerScreen";

type Screen = "disclaimer" | "camera";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("disclaimer");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center break-keep px-6 py-10">
      {screen === "disclaimer" && (
        <DisclaimerScreen onStart={() => setScreen("camera")} />
      )}
      {screen === "camera" && (
        <CameraScreen onBack={() => setScreen("disclaimer")} />
      )}
    </main>
  );
}

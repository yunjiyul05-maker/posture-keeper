"use client";

// Design Ref: §2.5 — 화면 전환 담당. ① 시작 전 안내 → ② 카메라 준비 → ③ 운동 → (끝내면) ①.
import { useState } from "react";
import CameraScreen from "@/components/CameraScreen";
import DisclaimerScreen from "@/components/DisclaimerScreen";
import WorkoutScreen from "@/components/WorkoutScreen";

type Screen = "disclaimer" | "camera" | "workout";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("disclaimer");
  // ②에서 허용받은 카메라. ③에서 쓰고, ③이 끝나면 ③이 끈다.
  const [stream, setStream] = useState<MediaStream | null>(null);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center break-keep px-6 py-10">
      {screen === "disclaimer" && (
        <DisclaimerScreen onStart={() => setScreen("camera")} />
      )}
      {screen === "camera" && (
        <CameraScreen
          onBack={() => setScreen("disclaimer")}
          onStart={(live) => {
            setStream(live);
            setScreen("workout");
          }}
        />
      )}
      {screen === "workout" && stream && (
        <WorkoutScreen
          stream={stream}
          onEnd={() => {
            stream.getTracks().forEach((track) => track.stop()); // 카메라를 즉시 끈다
            setStream(null);
            setScreen("disclaimer");
          }}
        />
      )}
    </main>
  );
}

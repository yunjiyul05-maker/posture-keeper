"use client";

// Design Ref: §2.5 — 화면 전환 담당. ① 시작 전 안내 → ② 카메라 준비 → ③ 운동 → (끝내기) ④ 축하 → ①.
// 앱 화면이 가려져 끝나면 축하 없이 바로 ①로 돌아간다.
import { useState } from "react";
import CameraScreen from "@/components/CameraScreen";
import DisclaimerScreen from "@/components/DisclaimerScreen";
import FinishScreen from "@/components/FinishScreen";
import WorkoutScreen from "@/components/WorkoutScreen";

type Screen = "disclaimer" | "camera" | "workout" | "finish";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("disclaimer");
  // ②에서 허용받은 카메라. ③에서 쓰고, ③이 끝나면 ③이 끈다.
  const [stream, setStream] = useState<MediaStream | null>(null);

  /** 카메라를 즉시 끄고 다음 화면으로 */
  function endWorkout(next: Screen) {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setScreen(next);
  }

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
          onEnd={() => endWorkout("disclaimer")}
          onFinish={() => endWorkout("finish")}
        />
      )}
      {screen === "finish" && (
        <FinishScreen onHome={() => setScreen("disclaimer")} />
      )}
    </main>
  );
}

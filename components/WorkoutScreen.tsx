"use client";

// Design Ref: §2.4 — ③ 운동 화면. 위쪽 큰 카메라 영상(+뼈대), 아래 안내 문구 1개, "운동 끝내기"는 항상 보인다.
// 운동이 끝나면 카메라를 즉시 끈다. (PRD: 운동 중에만 카메라 사용)
// "운동 끝내기" → onFinish(④ 축하 화면), 앱 화면이 가려짐 → onEnd(축하 없이 ①로).
// 교정(10번)·위험(11번) 판정은 usePoseTracking이 이 화면에서만 돌린다.
import { useEffect, useRef, useState } from "react";
import CameraView from "@/components/CameraView";
import GuidanceBanner from "@/components/GuidanceBanner";
import { usePoseTracking } from "@/hooks/usePoseTracking";
import {
  COUNTDOWN_SECONDS,
  GUIDANCE,
  countdownGuidance,
} from "@/lib/feedback/messages";

type Props = {
  /** ②에서 넘겨받은 켜진 카메라 */
  stream: MediaStream;
  /** 앱 화면이 가려져 운동이 끝남 → 조용히 ①로 */
  onEnd: () => void;
  /** "운동 끝내기"를 직접 눌러 끝냄 → 축하 화면 */
  onFinish: () => void;
};

export default function WorkoutScreen({ stream, onEnd, onFinish }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 시작 전 준비 시간: 폰을 세우고 자세를 잡는 동안 5→0초를 센다. 0이 되면 판정을 시작한다.
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  const { model, guidance, retryModel } =
    usePoseTracking({
    active: true,
    judging: count === 0, // 카운트다운이 끝난 뒤에만 교정·위험 판정을 한다
    videoRef,
    canvasRef,
  });

  // 앱 화면이 가려지면(다른 앱·탭으로 이동) 운동을 끝낸다. 카메라는 onEnd가 끈다.
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);
  useEffect(() => {
    function onHidden() {
      if (document.visibilityState === "hidden") onEndRef.current();
    }
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <div className="relative mx-auto w-fit max-w-full">
        <CameraView
          stream={stream}
          videoRef={videoRef}
          canvasRef={canvasRef}
          // 영상 높이는 화면 높이에서 안내·버튼 자리(18rem)를 뺀 만큼. 안내 문구와 끝내기 버튼이 스크롤 없이 보인다
          className="aspect-[3/4] h-[max(14rem,calc(100dvh-18rem))] w-auto max-w-full"
        />
        {/* 카운트다운 숫자: 영상 한가운데에 크게 보여 준다(소리 없이 화면으로만) */}
        {count > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <span className="text-[9rem] font-extrabold leading-none text-white [text-shadow:0_4px_24px_rgba(0,0,0,0.6)]">
              {count}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <GuidanceBanner
          guidance={
            model === "loading"
              ? GUIDANCE.loading
              : model === "error"
                ? GUIDANCE.offline
                : count > 0
                  ? countdownGuidance(count)
                  : guidance
          }
        />
        {model === "error" && (
          <button
            type="button"
            onClick={retryModel}
            className="btn-primary min-h-16 rounded-2xl px-6 text-2xl font-bold enabled:active:scale-[0.98]"
          >
            다시 시도
          </button>
        )}
        <button
          type="button"
          onClick={onFinish}
          className="btn-glass min-h-16 rounded-2xl px-6 text-2xl font-bold enabled:active:scale-[0.98]"
        >
          운동 끝내기
        </button>
      </div>
    </section>
  );
}

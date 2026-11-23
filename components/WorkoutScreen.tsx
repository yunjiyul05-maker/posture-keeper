"use client";

// Design Ref: §2.4 — ③ 운동 화면. 위쪽 큰 카메라 영상(+뼈대), 아래 안내 문구 1개, "운동 끝내기"는 항상 보인다.
// 운동이 끝나면(끝내기·앱 화면이 가려짐) onEnd가 카메라를 즉시 끄고 ①로 돌아간다. (PRD: 운동 중에만 카메라 사용)
// 교정(10번)·위험(11번) 판정은 usePoseTracking이 이 화면에서만 돌린다.
import { useEffect, useRef } from "react";
import CameraView from "@/components/CameraView";
import DebugPanel from "@/components/DebugPanel";
import GuidanceBanner from "@/components/GuidanceBanner";
import { usePoseTracking } from "@/hooks/usePoseTracking";
import { GUIDANCE } from "@/lib/feedback/messages";

type Props = {
  /** ②에서 넘겨받은 켜진 카메라 */
  stream: MediaStream;
  /** 운동 끝 → ①로 */
  onEnd: () => void;
};

export default function WorkoutScreen({ stream, onEnd }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { model, guidance, debugOn, debugInfo, resetDebug, retryModel } =
    usePoseTracking({
    active: true,
    judging: true, // 운동 화면에서만 교정·위험 판정을 한다
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
    // ?debug일 때 넓은 화면(노트북)에서는 영상은 왼쪽, 숫자판·안내·끝내기는 오른쪽에 가로로 놓는다
    <section
      className={`flex flex-col gap-4 ${
        debugOn ? "md:grid md:grid-cols-[auto_1fr] md:items-start md:gap-6" : ""
      }`}
    >
      <CameraView
        stream={stream}
        videoRef={videoRef}
        canvasRef={canvasRef}
        className={
          debugOn
            ? "aspect-[3/4] max-h-[70vh] md:h-[88vh] md:max-h-none md:w-auto"
            : "aspect-[3/4] max-h-[70vh]"
        }
      />
      <div className="flex flex-col gap-3">
        {debugOn && <DebugPanel info={debugInfo} onReset={resetDebug} />}
        <GuidanceBanner
          guidance={
            model === "loading"
              ? GUIDANCE.loading
              : model === "error"
                ? GUIDANCE.offline
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
          onClick={onEnd}
          className="btn-glass min-h-16 rounded-2xl px-6 text-2xl font-bold enabled:active:scale-[0.98]"
        >
          운동 끝내기
        </button>
      </div>
    </section>
  );
}

"use client";

// Design Ref: §3 — 데이터 흐름(밝기 → 관절 인식 → 신뢰도 → 지표 → 안내 고르기)을 매 프레임 돌린다.
// ② 카메라 준비 화면과 ③ 운동 화면이 같이 쓴다. 영상·좌표는 저장·전송하지 않고 화면에 그리기만 한다.
import { DrawingUtils, PoseLandmarker } from "@mediapipe/tasks-vision";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import type { DebugInfo } from "@/components/DebugPanel";
import { guidanceCandidates } from "@/lib/feedback/assess";
import type { Guidance } from "@/lib/feedback/messages";
import { createSelector } from "@/lib/feedback/selector";
import { playWarningBeep } from "@/lib/audio/beep";
import { measureBrightness } from "@/lib/pose/brightness";
import { checkConfidence } from "@/lib/pose/confidence";
import { loadLandmarker } from "@/lib/pose/landmarker";
import { createDangerTracker } from "@/lib/squat/danger";
import { classify } from "@/lib/squat/judge";
import { extractLeg, kneeForwardRatio } from "@/lib/squat/metrics";
import { BRIGHTNESS_INTERVAL_MS, MIN_BRIGHTNESS } from "@/lib/squat/thresholds";

export type ModelState = "loading" | "ready" | "error";

/** 주소에 ?debug 가 있을 때만 true (서버에서는 항상 false) */
export function useDebugFlag(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).has("debug"),
    () => false,
  );
}

type Options = {
  /** true인 동안만 모델을 불러오고 관절을 찾는다 */
  active: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** true면 자세를 판정해 교정·위험 안내를 한다(운동 화면). false면 준비 안내만 한다. */
  judging?: boolean;
};

export function usePoseTracking({
  active,
  videoRef,
  canvasRef,
  judging = false,
}: Options) {
  const debugOn = useDebugFlag();
  const [model, setModel] = useState<ModelState>("loading");
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const resetDebugRef = useRef(false);
  const debugOnRef = useRef(false);

  useEffect(() => {
    debugOnRef.current = debugOn;
  }, [debugOn]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let frame = 0;

    loadLandmarker()
      .then((landmarker) => {
        if (cancelled) return;
        setModel("ready");
        let lastTime = -1;
        let lastBrightnessAt = -Infinity;
        let dark = false;
        let brightnessValue: number | null = null;
        let maxRatio: number | null = null;
        let minRatio: number | null = null;
        let lastDebugAt = 0;
        const selector = createSelector();
        const danger = createDangerTracker();

        const loop = () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (
            video &&
            canvas &&
            video.readyState >= 2 &&
            video.currentTime !== lastTime
          ) {
            lastTime = video.currentTime;
            if (canvas.width !== video.videoWidth) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
            const now = performance.now();

            // 밝기 확인(약 0.5초마다) → 어두우면 관절 판단 결과와 상관없이 "어두움" 안내
            if (now - lastBrightnessAt >= BRIGHTNESS_INTERVAL_MS) {
              lastBrightnessAt = now;
              const brightness = measureBrightness(video);
              if (brightness !== null) {
                dark = brightness < MIN_BRIGHTNESS;
                brightnessValue = brightness;
              }
            }

            const result = landmarker.detectForVideo(video, now);
            const joints = result.landmarks[0];
            const { ok, side } = checkConfidence(joints);

            // 무릎 전방 이동 비율: 몸이 잘 보일 때만 계산한다(안 보이면 판정 중단)
            const leg = ok && side ? extractLeg(joints, side) : null;
            const ratio = leg
              ? kneeForwardRatio(leg, video.videoWidth / video.videoHeight)
              : null;
            const level = judging ? classify(ratio) : null;

            // 위험 확정(연속 0.3초): 확정되면 경고 + 경고음(처음과 2초 간격 반복)
            const { active: dangerActive, beep } = judging
              ? danger.update(level, now)
              : { active: false, beep: false };
            if (beep) playWarningBeep();

            // 개발용 숫자판: 0.1초마다 화면 숫자를 갱신한다
            if (debugOnRef.current && now - lastDebugAt >= 100) {
              lastDebugAt = now;
              if (resetDebugRef.current) {
                maxRatio = null;
                minRatio = null;
                resetDebugRef.current = false;
              }
              if (ratio !== null) {
                maxRatio = maxRatio === null ? ratio : Math.max(maxRatio, ratio);
                minRatio = minRatio === null ? ratio : Math.min(minRatio, ratio);
              }
              setDebugInfo({
                ratio,
                max: maxRatio,
                min: minRatio,
                brightness: brightnessValue,
                side,
                bodyVisible: ok,
              });
            }

            const { current } = selector.select(
              guidanceCandidates({ dark, bodyVisible: ok, level, dangerActive }),
              now,
            );
            setGuidance((prev) => (prev?.id === current?.id ? prev : current));

            // 뼈대 점·선 그리기
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              const drawing = new DrawingUtils(ctx);
              for (const points of result.landmarks) {
                drawing.drawConnectors(points, PoseLandmarker.POSE_CONNECTIONS, {
                  color: "#5ac8fa",
                  lineWidth: 4,
                });
                drawing.drawLandmarks(points, { color: "#ffffff", radius: 4 });
              }
            }
          }
          frame = requestAnimationFrame(loop);
        };
        loop();
      })
      .catch(() => {
        if (!cancelled) setModel("error");
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [active, judging, videoRef, canvasRef]);

  return {
    model,
    guidance,
    debugOn,
    debugInfo,
    resetDebug: () => {
      resetDebugRef.current = true;
    },
  };
}

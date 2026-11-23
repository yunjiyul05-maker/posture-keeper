"use client";

// Design Ref: §2.3 — ② 카메라 준비 화면. 권한 요청, 거부·카메라 없음·보안 연결 아님 안내,
// 허용되면 카메라 영상(거울 표시)과 준비 상태, 그리고 "운동 시작" 버튼까지(PLAN 3·4·5·7번).
// Design Ref: §7 — 영상은 화면에만 띄우고 저장·전송하지 않는다. 화면을 나가면 카메라를 끈다.
import { useEffect, useRef, useState } from "react";
import CameraView from "@/components/CameraView";
import GuidanceBanner from "@/components/GuidanceBanner";
import { usePoseTracking } from "@/hooks/usePoseTracking";
import { unlockAudio } from "@/lib/audio/beep";
import { GUIDANCE } from "@/lib/feedback/messages";

type Status =
  | "idle" // 아직 요청 전
  | "requesting" // 허용 창이 떠 있음
  | "granted" // 허용됨
  | "denied" // 사용자가 거부했거나 브라우저가 막음
  | "no-camera" // 카메라 장치가 없음
  | "busy" // 다른 앱이 카메라를 쓰는 중이거나 켜지 못함
  | "insecure"; // https가 아니라서 카메라를 쓸 수 없음

type Props = {
  /** "처음으로" 버튼 */
  onBack: () => void;
  /** "운동 시작" 버튼. 켜진 카메라의 관리를 운동 화면에 넘긴다 */
  onStart: (stream: MediaStream) => void;
};

/** iPhone·Safari인지 확인해 다시 허용하는 방법 문구를 나눈다 */
function isSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua);
  const isDesktopSafari =
    /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Android/.test(ua);
  return isIos || isDesktopSafari;
}

export default function CameraScreen({ onBack, onStart }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // 허용된 뒤 모델을 불러오고 관절 추적·안내를 돌린다(③ 운동 화면과 같은 로직)
  const { model, guidance, retryModel } =
    usePoseTracking({
    active: status === "granted",
    videoRef,
    canvasRef,
  });

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }

  // 화면을 떠나거나(처음으로·탭 닫기) 앱 화면이 가려지면 카메라를 바로 끈다
  useEffect(() => {
    function onHidden() {
      if (document.visibilityState === "hidden" && streamRef.current) {
        stopCamera();
        setStatus("idle");
      }
    }
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      // 운동 시작으로 넘긴 경우 streamRef가 비어 있어 끄지 않는다(운동 화면이 이어서 쓴다)
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function requestCamera() {
    unlockAudio(); // 버튼을 누른 이 순간에 소리를 쓸 수 있게 해 둔다
    // 보안 연결(https, 또는 localhost)이 아니면 브라우저가 카메라 기능을 아예 주지 않는다
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus("insecure");
      return;
    }

    setStatus("requesting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // 화면을 보며 운동하므로 전면 카메라
        audio: false,
      });
      stopCamera(); // 다시 시도로 이전 영상이 남아 있으면 먼저 끈다
      streamRef.current = media;
      setStream(media);
      setStatus("granted");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setStatus("denied");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setStatus("no-camera");
      } else {
        setStatus("busy");
      }
    }
  }

  const buttonBase =
    "min-h-16 rounded-2xl px-6 text-2xl font-bold enabled:active:scale-[0.98] disabled:cursor-not-allowed";
  const primary = `${buttonBase} btn-primary`;
  const secondary = `${buttonBase} btn-glass`;

  return (
    <section className="flex flex-col gap-5" aria-live="polite">
      <h1 className="large-title px-1">카메라 준비</h1>

      {(status === "idle" || status === "requesting") && (
        <>
          <p className="glass p-5 text-2xl leading-relaxed">
            몸의 자세를 보려면 카메라가 필요해요. 영상은 저장·전송되지 않아요.
          </p>
          <button
            type="button"
            onClick={requestCamera}
            disabled={status === "requesting"}
            className={primary}
          >
            {status === "requesting" ? "허용을 기다리는 중이에요" : "카메라 허용하기"}
          </button>
        </>
      )}

      {status === "granted" && (
        <div className="flex flex-col gap-5">
          <CameraView
            stream={stream}
            videoRef={videoRef}
            canvasRef={canvasRef}
          />
          <div className="flex flex-col gap-5">
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
              <button type="button" onClick={retryModel} className={secondary}>
                다시 시도
              </button>
            )}
            {/* 카메라 허용 + 모델 준비 완료가 되어야 켜진다(몸이 인식되는지는 조건이 아니다) */}
            <button
              type="button"
              disabled={model !== "ready"}
              onClick={() => {
                unlockAudio(); // 운동 시작을 누른 순간 소리를 다시 깨운다(iPhone 대비)
                const live = streamRef.current;
                if (!live) return;
                streamRef.current = null; // 카메라 관리를 운동 화면에 넘긴다
                onStart(live);
              }}
              className={primary}
            >
              운동 시작
            </button>
          </div>
        </div>
      )}

      {status === "denied" && (
        <>
          <p className="text-2xl font-semibold leading-relaxed">
            카메라가 막혀 있어요.
          </p>
          <p className="text-xl leading-relaxed">
            자세를 알려 드리려면 카메라가 꼭 필요해요. 카메라 없이는 운동을
            시작할 수 없어요.
          </p>
          <div className="glass p-5 text-xl leading-relaxed">
            <p className="mb-2 font-bold">다시 허용하는 방법</p>
            {isSafari() ? (
              <p>
                주소창 왼쪽의 &lsquo;aA&rsquo; 버튼을 누르고, 웹사이트 설정에서
                카메라를 &lsquo;허용&rsquo;으로 바꿔 주세요.
              </p>
            ) : (
              <p>
                주소창 왼쪽의 아이콘을 누르고, 권한에서 카메라를
                &lsquo;허용&rsquo;으로 바꿔 주세요.
              </p>
            )}
          </div>
          <button type="button" onClick={requestCamera} className={primary}>
            다시 시도
          </button>
        </>
      )}

      {status === "no-camera" && (
        <>
          <p className="text-2xl font-semibold leading-relaxed">
            카메라를 찾지 못했어요.
          </p>
          <p className="text-xl leading-relaxed">
            카메라가 있는 폰에서 열어 주세요. 카메라 없이는 운동을 시작할 수
            없어요.
          </p>
          <button type="button" onClick={requestCamera} className={primary}>
            다시 시도
          </button>
        </>
      )}

      {status === "busy" && (
        <>
          <p className="text-2xl font-semibold leading-relaxed">
            카메라를 켜지 못했어요.
          </p>
          <p className="text-xl leading-relaxed">
            다른 앱이 카메라를 쓰고 있지 않은지 확인하고 다시 시도해 주세요.
          </p>
          <button type="button" onClick={requestCamera} className={primary}>
            다시 시도
          </button>
        </>
      )}

      {status === "insecure" && (
        <>
          <p className="text-2xl font-semibold leading-relaxed">
            보안 연결에서만 카메라를 쓸 수 있어요.
          </p>
          <p className="text-xl leading-relaxed">
            주소가 https로 시작하는지 확인해 주세요.
          </p>
        </>
      )}

      <button
        type="button"
        onClick={() => {
          stopCamera();
          onBack();
        }}
        className={secondary}
      >
        처음으로
      </button>
    </section>
  );
}

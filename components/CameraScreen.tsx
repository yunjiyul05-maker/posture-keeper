"use client";

// Design Ref: §2.3 — ② 카메라 준비 화면. 권한 요청, 거부·카메라 없음·보안 연결 아님 안내,
// 그리고 허용되면 카메라 영상을 거울처럼 보여 주는 것까지(PLAN 3·4번).
// Design Ref: §7 — 영상은 화면에만 띄우고 저장·전송하지 않는다. 화면을 나가면 카메라를 끈다.
import { DrawingUtils, PoseLandmarker } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";
import { loadLandmarker } from "@/lib/pose/landmarker";

type Status =
  | "idle" // 아직 요청 전
  | "requesting" // 허용 창이 떠 있음
  | "granted" // 허용됨
  | "denied" // 사용자가 거부했거나 브라우저가 막음
  | "no-camera" // 카메라 장치가 없음
  | "busy" // 다른 앱이 카메라를 쓰는 중이거나 켜지 못함
  | "insecure"; // https가 아니라서 카메라를 쓸 수 없음

type ModelState = "loading" | "ready" | "error";

type Props = {
  /** "처음으로" 버튼 */
  onBack: () => void;
};

/** iPhone·Safari인지 확인해 다시 허용하는 방법 문구를 나눈다 */
function isSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua);
  const isDesktopSafari =
    /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Android/.test(ua);
  return isIos || isDesktopSafari;
}

export default function CameraScreen({ onBack }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [model, setModel] = useState<ModelState>("loading");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
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
      stopCamera();
    };
  }, []);

  // 허용되어 영상 태그가 화면에 생기면 카메라 영상을 연결한다
  useEffect(() => {
    if (status === "granted" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  // 허용된 뒤 모델을 불러오고, 준비되면 매 프레임 관절을 찾아 영상 위에 그린다.
  // 좌표는 화면에 그리기만 하고 저장·전송하지 않는다.
  useEffect(() => {
    if (status !== "granted") return;
    let cancelled = false;
    let frame = 0;

    loadLandmarker()
      .then((landmarker) => {
        if (cancelled) return;
        setModel("ready");
        let lastTime = -1;
        const loop = () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.readyState >= 2 && video.currentTime !== lastTime) {
            lastTime = video.currentTime;
            if (canvas.width !== video.videoWidth) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
            const result = landmarker.detectForVideo(video, performance.now());
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
  }, [status]);

  async function requestCamera() {
    // 보안 연결(https, 또는 localhost)이 아니면 브라우저가 카메라 기능을 아예 주지 않는다
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus("insecure");
      return;
    }

    setStatus("requesting");
    setModel("loading"); // 새로 허용받을 때마다 준비 중 표시부터 시작
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // 화면을 보며 운동하므로 전면 카메라
        audio: false,
      });
      stopCamera(); // 다시 시도로 이전 영상이 남아 있으면 먼저 끈다
      streamRef.current = stream;
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
        <>
          {/* iPhone은 playsInline·muted가 없으면 전체 화면으로 바뀌거나 재생되지 않는다.
              -scale-x-100은 화면 표시만 거울처럼 좌우 반전한다. */}
          <div className="relative aspect-[3/4] w-full -scale-x-100 overflow-hidden rounded-2xl bg-black shadow-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="내 카메라 영상"
              className="h-full w-full object-cover"
            />
            {/* 뼈대 점·선: 영상과 같은 방식으로 잘리고 반전되어 겹쳐 보인다 */}
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <p className="text-2xl font-semibold leading-relaxed">
            {model === "loading" && "준비 중이에요"}
            {model === "ready" && "폰을 옆에 세워 주세요"}
            {model === "error" && "인터넷을 확인해 주세요"}
          </p>
        </>
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

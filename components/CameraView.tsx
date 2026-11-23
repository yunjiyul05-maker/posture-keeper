"use client";

// Design Ref: §2.4·§5 — 카메라 영상 + 뼈대 그림. 화면 표시만 거울처럼 좌우 반전한다
// (관절 계산은 반전하지 않은 좌표로 한다). 영상은 저장·전송하지 않는다.
import { useEffect, type RefObject } from "react";

type Props = {
  stream: MediaStream | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** 영상 칸 크기. 화면 높이에 맞춰 안내 문구가 스크롤 없이 보이게 호출하는 쪽에서 정한다 */
  className?: string;
};

export default function CameraView({ stream, videoRef, canvasRef, className }: Props) {
  // 영상 태그에 카메라를 연결한다
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream, videoRef]);

  return (
    <div
      className={`relative mx-auto -scale-x-100 overflow-hidden rounded-2xl bg-black shadow-lg ${
        className ?? "aspect-[3/4] w-full"
      }`}
    >
      {/* iPhone은 playsInline·muted가 없으면 전체 화면으로 바뀌거나 재생되지 않는다 */}
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
  );
}

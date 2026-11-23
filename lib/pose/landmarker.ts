// Design Ref: §3·§4 — 기기 안에서 관절 좌표를 뽑는다(MediaPipe Pose Landmarker).
// 모델·실행 파일 모두 같은 사이트(public/)에서 받으므로 영상은 어디로도 전송되지 않는다.
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

let cached: Promise<PoseLandmarker> | null = null;

/** 모델을 한 번만 불러온다. 실패하면 다음에 다시 시도할 수 있게 캐시를 비운다. */
export function loadLandmarker(): Promise<PoseLandmarker> {
  if (!cached) {
    cached = createLandmarker().catch((error) => {
      cached = null;
      throw error;
    });
  }
  return cached;
}

async function createLandmarker(): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe");
  const options = (delegate: "GPU" | "CPU") => ({
    baseOptions: { modelAssetPath: "/models/pose_landmarker_lite.task", delegate },
    runningMode: "VIDEO" as const,
    numPoses: 1, // 혼자 운동하는 것이 전제
  });
  try {
    return await PoseLandmarker.createFromOptions(vision, options("GPU"));
  } catch {
    // GPU를 못 쓰는 기기에서는 CPU로 대신한다
    return await PoseLandmarker.createFromOptions(vision, options("CPU"));
  }
}

// Design Ref: §3 처리 1 — 밝기 확인. 작은 크기로 줄인 프레임의 평균 밝기(0~255)를 구한다.
// 픽셀은 계산하자마자 버리고 어디에도 저장·전송하지 않는다.
const SAMPLE_SIZE = 32;

let scratch: HTMLCanvasElement | null = null;

/** 영상 한 장면의 평균 밝기. 아직 재생 전이면 null */
export function measureBrightness(video: HTMLVideoElement): number | null {
  if (video.readyState < 2 || video.videoWidth === 0) return null;
  scratch ??= document.createElement("canvas");
  scratch.width = SAMPLE_SIZE;
  scratch.height = SAMPLE_SIZE;
  const ctx = scratch.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    // 사람 눈에 느껴지는 밝기 비율(Rec.601)
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  // 계산이 끝났으니 줄여 그린 장면을 바로 지운다(영상 조각을 메모리에 남기지 않는다)
  ctx.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  return sum / (SAMPLE_SIZE * SAMPLE_SIZE);
}

// MediaPipe 실행 파일(wasm)을 우리 사이트(public/mediapipe)에서 제공하도록 복사한다.
// 외부 주소(CDN)에서 받지 않으므로 영상·데이터가 밖으로 나가지 않고, 인터넷 연결 의존도도 줄어든다.
import { cpSync, mkdirSync } from "node:fs";

mkdirSync("public/mediapipe", { recursive: true });
cpSync("node_modules/@mediapipe/tasks-vision/wasm", "public/mediapipe", {
  recursive: true,
});
console.log("MediaPipe wasm 복사 완료 → public/mediapipe");

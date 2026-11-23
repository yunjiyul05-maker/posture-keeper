// 서버 전송 0건 점검(PRD: 영상·이미지·좌표를 밖으로 보내지 않는다).
// 앱 코드(app, components, hooks, lib)에 네트워크로 데이터를 보내는 코드가 있는지 훑는다.
// 결과가 "문제 없음"이면 통과, 발견되면 위치를 알려 주고 실패(종료 코드 1)한다.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// 인자로 폴더를 주면 그 폴더만 훑는다(점검 도구 자체를 시험할 때 쓴다)
const ROOTS = process.argv.length > 2 ? process.argv.slice(2) : ["app", "components", "hooks", "lib"];
// 데이터를 밖으로 보낼 수 있는 방법들
const PATTERNS = [
  [/\bfetch\s*\(/, "fetch 호출"],
  [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
  [/\bsendBeacon\b/, "navigator.sendBeacon"],
  [/\bWebSocket\b/, "WebSocket"],
  [/\bEventSource\b/, "EventSource"],
  [/\bRTCPeerConnection\b/, "WebRTC"],
  [/\bMediaRecorder\b/, "영상 녹화(MediaRecorder)"],
  [/\.toDataURL\s*\(|\.toBlob\s*\(/, "캔버스 이미지 추출"],
  [/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/, "브라우저 저장소"],
  [/https?:\/\/(?!localhost)/, "외부 주소(http/https)"],
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name) && !/\.test\./.test(name)) yield path;
  }
}

let found = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      // 주석 줄은 설명이므로 건너뛴다
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      for (const [re, label] of PATTERNS) {
        if (re.test(line)) {
          found += 1;
          console.log(`❌ ${file}:${i + 1}  ${label}\n   ${line.trim()}`);
        }
      }
    });
  }
}

if (found === 0) {
  console.log("✅ 서버 전송 코드 없음: 네트워크 전송·녹화·저장소·외부 주소 사용 0건");
} else {
  console.log(`\n${found}건 발견. 영상·좌표가 밖으로 나가거나 저장되지 않는지 확인하세요.`);
  process.exit(1);
}

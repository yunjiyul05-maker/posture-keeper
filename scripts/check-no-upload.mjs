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

// ── 빌드 결과·라이브러리 점검 (보안 점검 SEC-003) ──
// 앱 코드가 깨끗해도 라이브러리(MediaPipe 등) 안에 외부로 보내는 코드가 있을 수 있다.
// 1) 실제 데이터 전송 주소로 쓰이는 알려진 외부 서버가 빌드 결과에 있는지 찾고,
// 2) 있으면 next.config.ts의 CSP가 외부 연결(connect-src 'self')을 막고 있는지 확인한다.
// 인자로 폴더를 준 경우(점검 도구 시험용)에는 건너뛴다.
if (process.argv.length <= 2) {
  const BUILD_ROOTS = [".next/static", "public/mediapipe"].filter((d) => {
    try {
      return statSync(d).isDirectory();
    } catch {
      return false;
    }
  });
  // 전송용으로 알려진 외부 서버(문서 링크와 구분하기 위해 목록으로 관리한다)
  const KNOWN_SENDERS = ["odml.pa.googleapis.com"];
  const hits = new Set();
  function* walkAll(dir) {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) yield* walkAll(path);
      else if (/\.(js|mjs)$/.test(name)) yield path;
    }
  }
  for (const root of BUILD_ROOTS) {
    for (const file of walkAll(root)) {
      const text = readFileSync(file, "utf8");
      for (const host of KNOWN_SENDERS) if (text.includes(host)) hits.add(`${host} (${file})`);
    }
  }
  if (hits.size > 0) {
    const config = readFileSync("next.config.ts", "utf8");
    if (/connect-src 'self'/.test(config)) {
      console.log(`ℹ️ 라이브러리에 외부 전송 코드가 있지만 CSP(connect-src 'self')가 막고 있다:\n   ${[...hits].join("\n   ")}`);
    } else {
      found += 1;
      console.log(`❌ 라이브러리에 외부 전송 코드가 있는데 막는 설정이 없다:\n   ${[...hits].join("\n   ")}`);
    }
  }
}

if (found === 0) {
  console.log("✅ 서버 전송 코드 없음: 네트워크 전송·녹화·저장소·외부 주소 사용 0건");
} else {
  console.log(`\n${found}건 발견. 영상·좌표가 밖으로 나가거나 저장되지 않는지 확인하세요.`);
  process.exit(1);
}

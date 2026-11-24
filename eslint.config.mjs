import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 복사해 온 외부 실행 파일(MediaPipe)은 검사하지 않는다
    "public/mediapipe/**",
    // 삭제 대기 폴더(trash-can)는 앱 코드가 아니라 검사하지 않는다
    "trash-can/**",
  ]),
]);

export default eslintConfig;

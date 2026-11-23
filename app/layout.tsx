// Design Ref: §4 — 앱 공통 틀. 한국어 문서, 큰 글씨 기본값은 globals.css에서 적용한다.
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "자세지킴",
  description: "스마트폰 카메라로 스쿼트 자세를 기기 안에서 바로 알려 드려요.",
};

// 스마트폰 세로 화면 기준: 화면 너비에 맞추고, 글씨를 키워도 확대할 수 있게 둔다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

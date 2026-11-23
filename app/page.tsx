// Design Ref: §2 — 앱 첫 화면. 이번 작업(PLAN 1번)은 큰 글씨 기본 틀과 첫 화면 뼈대까지만 만든다.
// 시작 전 안내(②)와 "확인해야 시작" 동작은 PLAN 2번에서 이어서 만든다.
export default function Home() {
  return (
    <main className="mx-auto break-keep flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-5xl font-bold tracking-tight">자세지킴</h1>
      <p className="text-2xl leading-relaxed">
        스마트폰 카메라로 스쿼트 자세를 바로 알려 드려요.
      </p>
      <p className="text-xl text-zinc-600 dark:text-zinc-300">
        영상은 저장되거나 전송되지 않아요.
      </p>
    </main>
  );
}

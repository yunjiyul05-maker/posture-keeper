"use client";

// Design Ref: §2.2 — ① 시작 전 안내 화면 (의료 면책·카메라 안내·옷 권장).
// Plan SC: "확인해야 시작" — 확인 체크 전에는 시작 버튼이 눌리지 않는다.
import { useState } from "react";

type Props = {
  /** 확인 체크 후 "스쿼트 시작"을 눌렀을 때 호출된다 */
  onStart: () => void;
};

export default function DisclaimerScreen({ onStart }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-5xl font-bold tracking-tight">자세지킴</h1>

      {/* 의료 면책: 진단·치료를 하지 않고, 통증이 있으면 멈추고 상담하라고만 안내한다 */}
      <p className="text-2xl font-semibold leading-relaxed">
        이 앱은 의료기기가 아니며 진단·치료를 하지 않습니다. 통증이 있으면
        운동을 멈추고 전문가와 상담하세요.
      </p>

      <ul className="flex list-disc flex-col gap-3 pl-6 text-xl">
        <li>카메라로 관절 위치만 확인해요. 영상은 저장·전송되지 않아요.</li>
        <li>폰을 옆에 세워 두고, 몸이 다 보이게 서 주세요.</li>
        <li>몸 윤곽이 보이는 옷을 입으세요.</li>
        <li>혼자 찍히게 해 주세요.</li>
      </ul>

      <label className="flex min-h-14 cursor-pointer items-center gap-4 text-xl font-semibold">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="h-8 w-8 shrink-0 cursor-pointer accent-blue-700"
        />
        위 내용을 확인했어요
      </label>

      <button
        type="button"
        disabled={!confirmed}
        onClick={onStart}
        className="min-h-16 rounded-2xl bg-blue-700 px-6 text-2xl font-bold text-white enabled:active:bg-blue-900 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-300"
      >
        스쿼트 시작
      </button>
    </section>
  );
}

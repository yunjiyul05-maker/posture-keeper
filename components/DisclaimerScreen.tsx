"use client";

// Design Ref: §2.2 — ① 시작 전 안내 화면 (의료 면책·카메라 안내·옷 권장).
// Plan SC: "확인해야 시작" — 확인 체크 전에는 시작 버튼이 눌리지 않는다.
// 모양: 애플(iOS)식 큰 제목 + 유리 카드 + 묶음 목록 + 스위치.
import { useState } from "react";

type Props = {
  /** 확인 후 "스쿼트 시작"을 눌렀을 때 호출된다 */
  onStart: () => void;
};

const tips = [
  { icon: "📷", text: "카메라로 관절 위치만 확인해요. 영상은 저장·전송되지 않아요." },
  { icon: "📱", text: "폰을 옆에 세워 두고, 몸이 다 보이게 서 주세요." },
  { icon: "👕", text: "몸 윤곽이 보이는 옷을 입으세요." },
  { icon: "👤", text: "혼자 찍히게 해 주세요." },
];

export default function DisclaimerScreen({ onStart }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <section className="flex flex-col gap-5">
      <h1 className="large-title px-1">자세지킴</h1>

      {/* 의료 면책: 진단·치료를 하지 않고, 통증이 있으면 멈추고 상담하라고만 안내한다 */}
      <p className="callout p-5 text-xl font-semibold leading-relaxed">
        이 앱은 의료기기가 아니며 진단·치료를 하지 않습니다. 통증이 있으면
        운동을 멈추고 전문가와 상담하세요.
      </p>

      <ul className="grouped text-xl">
        {tips.map((tip) => (
          <li key={tip.text}>
            <span className="icon-chip" aria-hidden="true">
              {tip.icon}
            </span>
            <span>{tip.text}</span>
          </li>
        ))}
      </ul>

      <label className="glass flex min-h-16 cursor-pointer items-center justify-between gap-4 px-5 py-3 text-xl font-semibold">
        위 내용을 확인했어요
        <input
          type="checkbox"
          role="switch"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="peer sr-only"
        />
        <span className="ios-switch" aria-hidden="true" />
      </label>

      <button
        type="button"
        disabled={!confirmed}
        onClick={onStart}
        className="btn-primary min-h-16 rounded-2xl px-6 text-2xl font-bold enabled:active:scale-[0.98] disabled:cursor-not-allowed"
      >
        스쿼트 시작
      </button>
    </section>
  );
}

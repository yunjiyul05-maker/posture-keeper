// Design Ref: §2.4 — 안내 문구 영역. 큰 글씨 1문장, 위험이면 빨간 배경 + 통증 안내.
import type { Guidance } from "@/lib/feedback/messages";

type Props = {
  guidance: Guidance | null;
};

export default function GuidanceBanner({ guidance }: Props) {
  const danger = guidance?.kind === "danger";

  return (
    <div
      role={danger ? "alert" : "status"}
      aria-live={danger ? "assertive" : "polite"}
      className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl px-5 py-4 text-center ${
        danger ? "bg-red-700 text-white" : "glass text-[#0b1b33]"
      }`}
    >
      <p className="text-4xl font-extrabold leading-tight">
        {guidance?.text ?? " "}
      </p>
      {danger && (
        <p className="text-lg font-semibold">
          통증이 있으면 운동을 멈추고 전문가와 상담하세요.
        </p>
      )}
    </div>
  );
}

// 개발·시험 전용 숫자판(PRD 6장). 주소 뒤에 ?debug 를 붙였을 때만 보인다.
// 영상은 저장하지 않고, 지금 계산된 숫자만 화면에 띄운다. PLAN 9번 기준값을 정할 때 쓴다.

export type DebugInfo = {
  /** 무릎 전방 이동 비율(몸이 안 보이면 null) */
  ratio: number | null;
  /** 이번 측정에서 가장 컸던/작았던 비율 */
  max: number | null;
  min: number | null;
  brightness: number | null;
  side: "left" | "right" | null;
  bodyVisible: boolean;
};

type Props = {
  info: DebugInfo | null;
  onReset: () => void;
};

const fmt = (v: number | null, digits = 2) =>
  v === null ? "—" : v.toFixed(digits);

export default function DebugPanel({ info, onReset }: Props) {
  return (
    <div className="glass flex flex-col gap-3 p-5" aria-label="개발용 숫자판">
      <p className="text-lg font-bold text-[#0a4fb8]">개발용 숫자판 (?debug)</p>
      <p className="text-xl font-semibold">
        무릎 전방 이동 비율{" "}
        <span className="text-4xl font-extrabold tabular-nums">
          {fmt(info?.ratio ?? null)}
        </span>
      </p>
      <p className="text-lg tabular-nums">
        가장 컸던 값 {fmt(info?.max ?? null)} · 가장 작았던 값{" "}
        {fmt(info?.min ?? null)}
      </p>
      <p className="text-lg tabular-nums">
        밝기 {fmt(info?.brightness ?? null, 0)} · 카메라 쪽 다리{" "}
        {info?.side === "left" ? "왼쪽" : info?.side === "right" ? "오른쪽" : "—"}{" "}
        · 몸 {info?.bodyVisible ? "잘 보임" : "안 보임"}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="btn-glass min-h-14 rounded-2xl px-4 text-xl font-bold"
      >
        최댓값·최솟값 지우기
      </button>
    </div>
  );
}

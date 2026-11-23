// Design Ref: §5 — 경고음(Web Audio). 소리 파일 없이 기기 안에서 만든다.
// iPhone·Android 브라우저는 사용자가 화면을 한 번 눌러야 소리를 허용하므로,
// "카메라 허용하기" 같은 버튼을 누를 때 unlockAudio()를 불러 둔다.
// iPhone 무음 모드에서는 소리가 나지 않을 수 있어, 위험 경고는 빨간 화면도 함께 보여 준다.
let context: AudioContext | null = null;

/** 사용자가 버튼을 누른 순간에 불러서 소리를 쓸 수 있게 한다 */
export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  if (!context) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume();
}

/** 짧고 높은 경고음 2번 */
export function playWarningBeep(): void {
  if (!context) return;
  // 소리 장치가 멈춰 있으면 깨워 둔다(이번 한 번은 못 내도 다음 반복 때 난다)
  if (context.state === "suspended") void context.resume();
  if (context.state !== "running") return;
  const start = context.currentTime;
  for (const offset of [0, 0.25]) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.4, start + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.2);
    osc.connect(gain).connect(context.destination);
    osc.start(start + offset);
    osc.stop(start + offset + 0.22);
  }
}

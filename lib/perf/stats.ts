// Design Ref: §3 시간 예산 — 처리 시간 측정. 최근 N개 값의 평균·최댓값을 계산한다.
// 개발용 숫자판(?debug)에서 "응답 1초 이내" 목표를 확인할 때 쓴다.

export function createRollingStats(size = 60) {
  const values: number[] = [];

  function add(value: number) {
    values.push(value);
    if (values.length > size) values.shift();
  }

  function average(): number | null {
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  function max(): number | null {
    return values.length === 0 ? null : Math.max(...values);
  }

  return { add, average, max, count: () => values.length };
}

/**
 * 위험 경고가 늦어지는 시간의 추정값(밀리초).
 * 위험이 0.3초 이어졌다고 확정하는 시점에서, 마지막 프레임을 받아 판정하고 화면에 그리기까지의 지연이다.
 * ≈ 프레임 간격 + 처리 시간. PRD 목표: 0.3초 확정 뒤 0.5초 이내에 경고(= 이 값 500 이하).
 */
export function estimateWarningDelay(
  frameIntervalMs: number | null,
  processingMs: number | null,
): number | null {
  if (frameIntervalMs === null || processingMs === null) return null;
  return frameIntervalMs + processingMs;
}

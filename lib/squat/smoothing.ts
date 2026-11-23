// Design Ref: §3 처리 4 — 지표 흔들림 줄이기. 최근 몇 프레임의 중앙값을 쓴다.
// 한 프레임만 튀는 오인식 값이 판정(특히 위험)을 흔들지 않게 한다.
// 평균보다 중앙값이 튀는 값에 덜 끌려간다. 5프레임은 약 0.17초(30fps)라 0.3초 확정 규칙 안에 들어간다.

export function createMedianFilter(size = 5) {
  const values: number[] = [];

  /** 새 값을 넣고 최근 값들의 중앙값을 돌려준다. null이면(판정 중단) 기록을 비우고 null */
  function push(value: number | null): number | null {
    if (value === null) {
      values.length = 0;
      return null;
    }
    values.push(value);
    if (values.length > size) values.shift();
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return { push };
}

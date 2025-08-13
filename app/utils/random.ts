export type RNG = () => number; // 0~1

export function chooseWeighted<T>(
  items: Array<{ value: T; weight: number }>,
  rng: RNG = Math.random
): T {
  const total = items.reduce((acc, it) => acc + Math.max(0, it.weight || 0), 0);
  const sum = Math.max(1e-6, total);
  const r = rng() * sum;
  let acc = 0;
  for (const it of items) {
    acc += Math.max(0, it.weight || 0);
    if (r <= acc) return it.value;
  }
  return items[items.length - 1]?.value;
}

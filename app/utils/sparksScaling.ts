export type HeightRange = {
  min: number;
  max: number;
};

export type BurstConfig = {
  minBurst: number;
  maxBurst: number;
};

export type CountConfig = {
  minCount: number;
  maxCount: number;
  burstHeadroomRatio: number; // count >= burst * ratio 를 보장
};

export const DEFAULT_BURST_CONFIG: BurstConfig = {
  minBurst: 4,
  maxBurst: 28,
};

export const DEFAULT_COUNT_CONFIG: CountConfig = {
  minCount: 4,
  maxCount: 48,
  burstHeadroomRatio: 1.5,
};

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function heightToUnit(height: number, range: HeightRange): number {
  const denom = Math.max(1e-6, range.max - range.min);
  return clamp01((height - range.min) / denom);
}

export function computeBurst(
  height: number,
  range: HeightRange,
  cfg: BurstConfig = DEFAULT_BURST_CONFIG
): number {
  const u = heightToUnit(height, range);
  const burst = Math.round(cfg.minBurst + (cfg.maxBurst - cfg.minBurst) * u);
  return Math.max(cfg.minBurst, Math.min(cfg.maxBurst, burst));
}

export function computeCount(
  height: number,
  range: HeightRange,
  burst: number,
  cfg: CountConfig = DEFAULT_COUNT_CONFIG
): number {
  const u = heightToUnit(height, range);
  const desired = Math.round(cfg.minCount + (cfg.maxCount - cfg.minCount) * u);
  const minByHeadroom = Math.ceil(burst * cfg.burstHeadroomRatio);
  return Math.max(desired, minByHeadroom);
}

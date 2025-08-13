export type HeightRange = {
  min: number;
  max: number;
};

export type BurstConfig = {
  minBurst: number;
  maxBurst: number;
  alpha?: number; // 지수 곡률(>1일수록 끝에서 급격히 증가)
  threshold?: number; // u가 이 값 미만이면 0으로 억제
};

export type CountConfig = {
  minCount: number;
  maxCount: number;
  burstHeadroomRatio: number; // count >= burst * ratio 를 보장
  alpha?: number; // 지수 곡률
  threshold?: number; // u가 이 값 미만이면 0으로 억제
};

import { CHARGED_ACTION_THRESHOLD } from "~/constants/chargeThreshold";

export const DEFAULT_BURST_CONFIG: BurstConfig = {
  minBurst: 4,
  maxBurst: 28,
  alpha: 3.0,
  threshold: CHARGED_ACTION_THRESHOLD,
};

export const DEFAULT_COUNT_CONFIG: CountConfig = {
  minCount: 4,
  maxCount: 48,
  burstHeadroomRatio: 1.5,
  alpha: 2.6,
  threshold: CHARGED_ACTION_THRESHOLD,
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

function exp01(u: number, alpha: number): number {
  // 0~1 입력을 0~1로 지수 변환: alpha>0
  const a = Math.max(1e-6, alpha);
  const e = Math.exp(a) - 1;
  return e > 0 ? (Math.exp(a * clamp01(u)) - 1) / e : clamp01(u);
}

export function computeBurst(
  height: number,
  range: HeightRange,
  cfg: BurstConfig = DEFAULT_BURST_CONFIG
): number {
  const u = heightToUnit(height, range);
  const threshold = cfg.threshold ?? 0;
  if (u < threshold) return 0;
  const shaped = exp01(
    (u - threshold) / Math.max(1e-6, 1 - threshold),
    cfg.alpha ?? 1
  );
  const burst = Math.round(
    cfg.minBurst + (cfg.maxBurst - cfg.minBurst) * shaped
  );
  return Math.max(0, Math.min(cfg.maxBurst, burst));
}

export function computeCount(
  height: number,
  range: HeightRange,
  burst: number,
  cfg: CountConfig = DEFAULT_COUNT_CONFIG
): number {
  const u = heightToUnit(height, range);
  const threshold = cfg.threshold ?? 0;
  if (u < threshold) return 0;
  const shaped = exp01(
    (u - threshold) / Math.max(1e-6, 1 - threshold),
    cfg.alpha ?? 1
  );
  const desired = Math.round(
    cfg.minCount + (cfg.maxCount - cfg.minCount) * shaped
  );
  const minByHeadroom = Math.ceil(burst * cfg.burstHeadroomRatio);
  return Math.max(desired, minByHeadroom);
}

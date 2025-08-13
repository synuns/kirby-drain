export type BoingScaleOptions = {
  ySquashMax: number;
  xzStretchMax: number;
  yStretchMax: number;
  xzSquashMax: number;
  scaleLerp: number;
  velToAmount: number;
  clampMin: number;
  clampMax: number;
};

export const DEFAULT_BOING_SCALE: BoingScaleOptions = {
  ySquashMax: 0.14,
  xzStretchMax: 0.1,
  yStretchMax: 0.12,
  xzSquashMax: 0.08,
  scaleLerp: 0.18,
  velToAmount: 0.28,
  clampMin: 0.7,
  clampMax: 1.3,
};

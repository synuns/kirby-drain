export type ShiningStarsConfig = {
  modelPath: string;
  count: number;
  radiusRange: [number, number];
  yRange: [number, number];
  zRange: [number, number];
  scaleRange: [number, number];
  rotationSpeedRange: [number, number];
  seed: number;
};

export const SHINING_STARS_DEFAULT: ShiningStarsConfig = {
  modelPath: "/assets/models/shining-star.glb",
  count: 24,
  radiusRange: [2, 20],
  yRange: [-10, 10],
  zRange: [-2, -8],
  scaleRange: [0.5, 0.5],
  rotationSpeedRange: [0.3, 0.5],
  seed: 1337,
};

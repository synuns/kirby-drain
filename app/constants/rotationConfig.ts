import type { UseModelRotationOptions } from "~/hooks/useModelRotation";

type RotationDefaults = Required<
  Pick<
    UseModelRotationOptions,
    "maxYawRad" | "maxPitchRad" | "damping" | "deadzone" | "smoothFactor"
  >
>;

export const ROTATION_DEFAULTS: RotationDefaults = {
  maxYawRad: 0.4, // 좌우 각도
  maxPitchRad: 0.3, // 상하 각도
  damping: 0.12, // 감쇠
  deadzone: 0.03, // 데드존
  smoothFactor: 0.25, // 스무딩
};

export const LOCK_ON = {
  radius: 0.18,
  multiplier: 1.6,
} as const;

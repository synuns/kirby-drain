import { CHARGED_ACTION_THRESHOLD } from "~/constants/chargeThreshold";

export const HAPTIC_DEFAULTS = {
  vibrateMsCharged: 15,
  vibrateMsLand: 15,
  chargeThreshold: CHARGED_ACTION_THRESHOLD,
} as const;

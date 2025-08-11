import { useEffect, useRef } from "react";
import { HAPTIC_DEFAULTS } from "~/constants/hapticConfig";

type UseHapticsOptions = {
  getChargeProgress: () => number; // 0~1
  getLandingProgress: () => number; // 0~1, >0 시작이 착지 트리거
  vibrateMsCharged?: number;
  vibrateMsLand?: number;
  chargeThreshold?: number; // 0~1
};

export function useHaptics(options?: UseHapticsOptions) {
  const cfg = { ...HAPTIC_DEFAULTS, ...options };
  const prevCharge = useRef(0);
  const prevLand = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = options?.getChargeProgress?.();
      const lp = options?.getLandingProgress?.();

      // 충분 차지 임계 통과
      if (
        prevCharge.current < cfg.chargeThreshold &&
        p != null &&
        p >= cfg.chargeThreshold
      ) {
        if (navigator && "vibrate" in navigator)
          navigator.vibrate(cfg.vibrateMsCharged);
      }

      // 착지 시작 감지
      if (prevLand.current === 0 && lp != null && lp > 0) {
        if (navigator && "vibrate" in navigator)
          navigator.vibrate(cfg.vibrateMsLand);
      }
      prevCharge.current = p ?? 0;
      prevLand.current = lp ?? 0;
    }, 50);

    return () => window.clearInterval(id);
  }, [cfg]);
}

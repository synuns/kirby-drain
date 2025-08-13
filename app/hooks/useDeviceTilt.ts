import { useEffect, useRef, useState } from "react";
import { useMotionPermission } from "./useMotionPermission";

export type DeviceTiltOptions = {
  smoothFactor?: number; // 0~1, 높을수록 센서 입력을 더 빠르게 반영
};

const DEFAULTS: Required<DeviceTiltOptions> = {
  smoothFactor: 0.25,
};

/**
 * 디바이스 기울기(deviceorientation) Raw 센서 데이터를 수집하여 반환.
 * gamma (좌우), beta (앞뒤) 값을 사용하며, iOS/Android 모두에서 일관된 동작을 제공.
 * devicemotion의 모호성을 제거하여 안정적인 기울기 값을 보장.
 */
export function useDeviceTilt(options?: DeviceTiltOptions) {
  const cfg = { ...DEFAULTS, ...options };
  const { isSupported, needsPermission, hasPermission } = useMotionPermission();
  const [tilt, setTilt] = useState({ x: 0, y: 0, hasPermission });
  const smoothed = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !isSupported ||
      (needsPermission && !hasPermission)
    ) {
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // gamma (좌우, x축 회전)와 beta (앞뒤, y축 회전)를 사용
      const rawX = event.gamma ?? 0; // 좌우 기울기
      const rawY = event.beta ?? 0; // 앞뒤 기울기

      smoothed.current.x += (rawX - smoothed.current.x) * cfg.smoothFactor;
      smoothed.current.y += (rawY - smoothed.current.y) * cfg.smoothFactor;

      setTilt((prev) => ({
        ...prev,
        x: smoothed.current.x,
        y: smoothed.current.y,
      }));
    };

    const eventName = "deviceorientation";
    window.addEventListener(eventName, handleOrientation, true);

    return () => {
      window.removeEventListener(eventName, handleOrientation, true);
    };
  }, [cfg.smoothFactor, isSupported, needsPermission, hasPermission]);

  useEffect(() => {
    setTilt((prev) => ({ ...prev, hasPermission }));
  }, [hasPermission]);

  return tilt;
}

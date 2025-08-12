import { useEffect, useRef, useState } from "react";

export type DeviceTiltOptions = {
  /** 0~1, 높을수록 센서 입력을 더 빠르게 반영 */
  smoothFactor?: number;
  /** 중립 위치 보정 (디바이스 들고 있을 때 약간 기울어진 오프셋 제거) */
  calibrateOnFirstEvent?: boolean;
  /** 각도 제한 라디안 (정규화 출력에 곱해 사용 권장) */
  maxRadians?: number;
};

const DEFAULTS: Required<DeviceTiltOptions> = {
  smoothFactor: 0.25,
  calibrateOnFirstEvent: true,
  maxRadians: Math.PI / 4, // 내부적으로 쓰지 않지만 옵션으로 유지
};

/**
 * 디바이스 기울기(가속도/자이로) 기반 2D 입력을 -1~1 범위로 정규화하여 반환.
 * iOS/Android 모두 지원. 권한 요청(특히 iOS 13+)은 외부에서 수행해야 함.
 */
export function useDeviceTilt(options?: DeviceTiltOptions) {
  const cfg = { ...DEFAULTS, ...options };
  const [tilt, setTilt] = useState({ x: 0, y: 0, hasPermission: true });
  const smoothed = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const calibratedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMotion = (event: DeviceMotionEvent) => {
      // 우선순위: devicemotion의 가속도 중 중력 포함 값 이용
      const accG = event.accelerationIncludingGravity;
      if (!accG) return;

      // 기기 좌표계 기준: x(좌우), y(상하), z(앞뒤)
      const rawX = accG.x ?? 0; // 오른쪽으로 기울이면 +x
      const rawY = accG.y ?? 0; // 위로 기울이면 +y (디바이스 방향에 따라 상하가 바뀔 수 있음)

      // 단순 정규화: -10~10 m/s^2 범위를 -1~1로 매핑
      const normX = Math.max(-1, Math.min(1, rawX / 10));
      const normY = Math.max(-1, Math.min(1, rawY / 10));

      if (cfg.calibrateOnFirstEvent && !calibratedRef.current) {
        offsetRef.current = { x: normX, y: normY };
        calibratedRef.current = true;
      }

      const centeredX = normX - offsetRef.current.x;
      const centeredY = normY - offsetRef.current.y;

      // 스무딩 적용
      smoothed.current.x += (centeredX - smoothed.current.x) * cfg.smoothFactor;
      smoothed.current.y += (centeredY - smoothed.current.y) * cfg.smoothFactor;

      setTilt((prev) => ({
        ...prev,
        x: smoothed.current.x,
        y: smoothed.current.y,
      }));
    };

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0; // 좌우
      const beta = event.beta ?? 0; // 앞뒤

      const normX = Math.max(-1, Math.min(1, gamma / 45));
      const normY = Math.max(-1, Math.min(1, beta / 45));

      if (cfg.calibrateOnFirstEvent && !calibratedRef.current) {
        offsetRef.current = { x: normX, y: normY };
        calibratedRef.current = true;
      }

      const centeredX = normX - offsetRef.current.x;
      const centeredY = normY - offsetRef.current.y;

      smoothed.current.x += (centeredX - smoothed.current.x) * cfg.smoothFactor;
      smoothed.current.y += (centeredY - smoothed.current.y) * cfg.smoothFactor;

      setTilt((prev) => ({
        ...prev,
        x: smoothed.current.x,
        y: smoothed.current.y,
      }));
    };

    // 일부 브라우저는 둘 다 발행할 수 있으므로 우선순위로 devicemotion을 사용하고, 없을 때 orientation 사용
    // passive:true 로 스크롤/제스처 간섭 방지
    window.addEventListener(
      "devicemotion",
      handleMotion as EventListener,
      { passive: true } as any
    );
    window.addEventListener(
      "deviceorientation",
      handleOrientation as EventListener,
      { passive: true } as any
    );

    return () => {
      window.removeEventListener("devicemotion", handleMotion as EventListener);
      window.removeEventListener(
        "deviceorientation",
        handleOrientation as EventListener
      );
    };
  }, [cfg.smoothFactor, cfg.calibrateOnFirstEvent]);

  return tilt;
}

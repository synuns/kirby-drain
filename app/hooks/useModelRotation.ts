import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { useMouseFollow } from "./useMouseFollow";
import { LOCK_ON, ROTATION_DEFAULTS } from "~/constants/rotationConfig";
import { useAgent } from "./useAgent";
import { useDeviceTilt } from "./useDeviceTilt";

export type UseModelRotationOptions = {
  suppress?: boolean | (() => boolean); // 회전 일시정지(점프 등 우선 동작 시)
  suppressRef?: React.MutableRefObject<boolean> | null; // 외부 ref로 제어
  maxYawRad?: number; // 좌우 최대 회전 각도
  maxPitchRad?: number; // 상하 최대 회전 각도
  damping?: number; // 감쇠(0~1), 높을수록 빠르게 따라감
  deadzone?: number; // 입력 데드존(정규화 좌표)
  smoothFactor?: number; // 0~1, 1에 가까울수록 입력 즉시 반영
};

export function useModelRotation(options?: UseModelRotationOptions) {
  const { suppress = false, suppressRef = null, ...rest } = options ?? {};
  const cfg = { ...ROTATION_DEFAULTS, ...rest };
  const modelRef = useRef<Group>(null);
  const agent = useAgent();
  const mousePosition = useMouseFollow();
  const deviceTilt = useDeviceTilt({
    smoothFactor: rest.smoothFactor ?? ROTATION_DEFAULTS.smoothFactor,
  });
  const smoothed = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const ref = modelRef.current;
    if (!ref) return;

    // 입력 소스 분기: 모바일은 기울기, 데스크탑은 마우스
    const sourceX = agent.isMobile ? deviceTilt.x : mousePosition.x;
    const sourceY = agent.isMobile ? deviceTilt.y : mousePosition.y;

    smoothed.current.x += (sourceX - smoothed.current.x) * cfg.smoothFactor;
    smoothed.current.y += (sourceY - smoothed.current.y) * cfg.smoothFactor;

    const mag = Math.hypot(smoothed.current.x, smoothed.current.y);
    const inputX = mag < cfg.deadzone ? 0 : smoothed.current.x;
    const inputY = mag < cfg.deadzone ? 0 : smoothed.current.y;

    const near = mag <= LOCK_ON.radius;
    const mult = near ? LOCK_ON.multiplier : 1;
    const targetRotationY = inputX * cfg.maxYawRad * mult;
    const targetRotationX = -inputY * cfg.maxPitchRad * mult;

    const suppressed =
      (typeof suppress === "function" ? suppress() : suppress) ||
      (suppressRef?.current ?? false);
    if (suppressed) return;

    ref.rotation.y += (targetRotationY - ref.rotation.y) * cfg.damping;
    ref.rotation.x += (targetRotationX - ref.rotation.x) * cfg.damping;
  });

  return modelRef;
}

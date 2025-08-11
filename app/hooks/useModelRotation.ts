import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { useMouseFollow } from "./useMouseFollow";

type UseModelRotationOptions = {
  suppress?: boolean | (() => boolean); // 회전 일시정지(점프 등 우선 동작 시)
  suppressRef?: React.MutableRefObject<boolean> | null; // 외부 ref로 제어
  maxYawRad?: number; // 좌우 최대 회전 각도
  maxPitchRad?: number; // 상하 최대 회전 각도
  damping?: number; // 감쇠(0~1), 높을수록 빠르게 따라감
  deadzone?: number; // 입력 데드존(정규화 좌표)
  smoothFactor?: number; // 0~1, 1에 가까울수록 입력 즉시 반영
};

type RotationDefaults = Required<
  Pick<
    UseModelRotationOptions,
    "maxYawRad" | "maxPitchRad" | "damping" | "deadzone" | "smoothFactor"
  >
>;

const DEFAULTS: RotationDefaults = {
  maxYawRad: 0.4, // 좌우 각도
  maxPitchRad: 0.3, // 상하 각도
  damping: 0.12, // 감쇠
  deadzone: 0.03, // 데드존
  smoothFactor: 0.25, // 스무딩
};

export function useModelRotation(options?: UseModelRotationOptions) {
  const { suppress = false, suppressRef = null, ...rest } = options ?? {};
  const cfg = { ...DEFAULTS, ...rest };
  const modelRef = useRef<Group>(null);
  const mousePosition = useMouseFollow();
  const smoothed = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const ref = modelRef.current;
    if (!ref) return;

    smoothed.current.x +=
      (mousePosition.x - smoothed.current.x) * cfg.smoothFactor;
    smoothed.current.y +=
      (mousePosition.y - smoothed.current.y) * cfg.smoothFactor;

    const mag = Math.hypot(smoothed.current.x, smoothed.current.y);
    const inputX = mag < cfg.deadzone ? 0 : smoothed.current.x;
    const inputY = mag < cfg.deadzone ? 0 : smoothed.current.y;

    const targetRotationY = inputX * cfg.maxYawRad;
    const targetRotationX = -inputY * cfg.maxPitchRad;

    const suppressed =
      (typeof suppress === "function" ? suppress() : suppress) ||
      (suppressRef?.current ?? false);
    if (suppressed) return;

    ref.rotation.y += (targetRotationY - ref.rotation.y) * cfg.damping;
    ref.rotation.x += (targetRotationX - ref.rotation.x) * cfg.damping;
  });

  return modelRef;
}

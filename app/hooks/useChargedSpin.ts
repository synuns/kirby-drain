import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { CHARGED_ACTION_THRESHOLD } from "~/constants/chargeThreshold";
import { JUMP_DEFAULTS } from "~/constants/jumpConfig";
import { chooseWeighted, type RNG } from "~/utils/random";
import { easeInOutCubic } from "~/utils/easing";

type UseChargedSpinOptions = {
  groupRef: React.RefObject<Group | null>;
  getChargeProgress: () => number; // 0~1
  isJumping: () => boolean; // 점프 여부
  enabled?: boolean;
  durationMs?: number; // 회전 시간(ms)
  threshold?: number; // 0~1
  axisMode?: "random" | "x" | "y"; // 어느 축으로 스핀할지
  axisWeights?: { x: number; y: number }; // 랜덤 선택 가중치
  random?: RNG; // 시드 제어를 위한 랜덤 소스(0~1)
  revolutions?: number; // 회전 바퀴 수(정수)
};

export function useChargedSpin(options: UseChargedSpinOptions) {
  const {
    groupRef,
    getChargeProgress,
    isJumping,
    enabled = true,
    durationMs = JUMP_DEFAULTS.upMs,
    threshold = CHARGED_ACTION_THRESHOLD,
    axisMode = "random",
    axisWeights = { x: 1, y: 1 },
    random = Math.random,
    revolutions = 1,
  } = options;

  const prevIsJumpingRef = useRef(false);
  const maxChargeWhileIdleRef = useRef(0);
  const spinStartAtRef = useRef<number | null>(null);
  const spinBaseAngleRef = useRef(0);
  const spinAxisRef = useRef<"x" | "y">("y");
  const spinDurationMsRef = useRef(durationMs);
  const spinActiveRef = useRef(false);

  useFrame(() => {
    const ref = groupRef.current;
    const jumping = isJumping();

    // 점프 중이 아닐 때 차지 최대값을 누적
    if (!jumping) {
      const p = getChargeProgress();
      if (p > maxChargeWhileIdleRef.current) maxChargeWhileIdleRef.current = p;
    }

    // 점프 시작 감지
    if (!prevIsJumpingRef.current && jumping) {
      if (enabled && maxChargeWhileIdleRef.current >= threshold && ref) {
        const axis =
          axisMode === "x" || axisMode === "y"
            ? axisMode
            : chooseWeighted(
                [
                  {
                    value: "x" as const,
                    weight: Math.max(0, axisWeights.x ?? 0),
                  },
                  {
                    value: "y" as const,
                    weight: Math.max(0, axisWeights.y ?? 0),
                  },
                ],
                random
              );

        spinAxisRef.current = axis;
        spinStartAtRef.current = performance.now();
        spinBaseAngleRef.current =
          axis === "x" ? ref.rotation.x : ref.rotation.y;
        spinDurationMsRef.current = durationMs;
        spinActiveRef.current = true;
      }
      // 점프 시작 시 스냅샷 초기화
      maxChargeWhileIdleRef.current = 0;
    }

    if (spinActiveRef.current && ref && spinStartAtRef.current != null) {
      const now = performance.now();
      const t = Math.max(
        0,
        Math.min(
          1,
          (now - spinStartAtRef.current) /
            Math.max(1, spinDurationMsRef.current)
        )
      );
      const eased = easeInOutCubic(t);
      const fullTurn = Math.PI * 2 * Math.max(1, Math.round(revolutions));
      const value = spinBaseAngleRef.current + fullTurn * eased;
      if (spinAxisRef.current === "x") ref.rotation.x = value;
      else ref.rotation.y = value;
      if (t >= 1) {
        if (spinAxisRef.current === "x")
          ref.rotation.x = spinBaseAngleRef.current;
        else ref.rotation.y = spinBaseAngleRef.current;
        spinActiveRef.current = false;
      }
    }

    prevIsJumpingRef.current = jumping;
  });

  const isActive = () => spinActiveRef.current;
  const suppressRef = spinActiveRef;

  return { isActive, suppressRef } as const;
}

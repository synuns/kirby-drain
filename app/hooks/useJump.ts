import { useCallback, useEffect, useRef } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { JUMP_DEFAULTS } from "~/constants/jumpConfig";
import { mapChargeToFactor, computeChargeProgress } from "~/utils/jumpCharge";
import { useJumpControls } from "~/hooks/useJumpControls";
import {
  updateDown,
  updateIdle,
  updateRecover,
  updateUp,
} from "~/utils/jumpFrame";

type UseJumpOptions = {
  baseHeight?: number; // 기준 점프 높이
  upMs?: number; // 상승 시간(ms)
  downMs?: number; // 하강 시간(ms)
  recoverMs?: number; // 착지 후 복귀(ms)
  cooldownMs?: number; // 재입력 쿨다운(ms)
  // 길게 누를수록 높아지되 로그로 포화
  chargeKMs?: number; // 로그 스케일 기준(ms)
  maxChargeMs?: number; // 최대 차지 시간(ms)
  minFactor?: number; // 최소 배수
  maxFactor?: number; // 최대 배수
  // 차지 중 시각 피드백(점점 쪼그라듦)
  chargeSquashYMax?: number; // y축 최대 압축 비율(예: 0.15 → 15% 줄어듦)
  chargeStretchXZMax?: number; // xz축 최대 신장 비율(예: 0.08 → 8% 늘어남)
  chargeScaleLerp?: number; // 차지 스케일 보간 정도(0~1)
  landingFxMs?: number;
};

type JumpState = {
  phase: "idle" | "up" | "down" | "recover";
  start: number;
  cooldownUntil: number;
  height: number;
  pressStartedAt: number | null;
  lastLandingAt: number | null;
};

const DEFAULTS: Required<UseJumpOptions> = { ...JUMP_DEFAULTS };

export function useJump(
  groupRef: React.RefObject<Group | null>,
  options?: UseJumpOptions
) {
  const cfg = { ...DEFAULTS, ...(options ?? {}) };
  const state = useRef<JumpState>({
    phase: "idle",
    start: 0,
    cooldownUntil: 0,
    height: cfg.baseHeight,
    pressStartedAt: null,
    lastLandingAt: null,
  });
  const baseScale = useRef({ x: 1, y: 1, z: 1 });
  const baseY = useRef(0);
  const needsScaleResetOnJumpRef = useRef(false);

  const trigger = useCallback(() => {
    const now = performance.now();
    if (now < state.current.cooldownUntil) return false;
    if (state.current.phase !== "idle") return false;
    state.current.phase = "up";
    state.current.start = now;
    state.current.cooldownUntil = now + cfg.cooldownMs;
    return true;
  }, [cfg.cooldownMs]);

  useJumpControls({
    onStartPress: () => {
      if (state.current.phase !== "idle") return;
      if (state.current.pressStartedAt == null) {
        state.current.pressStartedAt = performance.now();
      }
    },
    onEndPress: () => {
      if (state.current.phase !== "idle") {
        state.current.pressStartedAt = null;
        return;
      }
      const now = performance.now();
      if (state.current.pressStartedAt == null) return;
      const heldMs = Math.min(
        cfg.maxChargeMs,
        now - state.current.pressStartedAt
      );
      state.current.pressStartedAt = null;
      const factor = mapChargeToFactor(
        heldMs,
        cfg.maxChargeMs,
        cfg.chargeKMs,
        cfg.minFactor,
        cfg.maxFactor
      );
      state.current.height = cfg.baseHeight * factor;
      needsScaleResetOnJumpRef.current = true;

      trigger();
    },
  });

  useFrame(() => {
    const ref = groupRef.current;
    if (!ref) return;
    const now = performance.now();
    if (state.current.phase === "idle") {
      updateIdle({
        ref,
        base: { baseY: baseY.current, baseScale: baseScale.current },
        cfg: {
          upMs: cfg.upMs,
          downMs: cfg.downMs,
          recoverMs: cfg.recoverMs,
          chargeScaleLerp: cfg.chargeScaleLerp,
          chargeSquashYMax: cfg.chargeSquashYMax,
          chargeStretchXZMax: cfg.chargeStretchXZMax,
        },
        pressStartedAt: state.current.pressStartedAt,
        chargeProgress: computeChargeProgress(
          state.current.pressStartedAt,
          now,
          cfg.maxChargeMs,
          cfg.chargeKMs
        ),
      });
      baseY.current = ref.position.y;
      const charging = state.current.pressStartedAt != null;
      if (!charging) {
        baseScale.current = { x: ref.scale.x, y: ref.scale.y, z: ref.scale.z };
      }
      return;
    }

    if (state.current.phase === "up") {
      if (needsScaleResetOnJumpRef.current) {
        ref.scale.set(
          baseScale.current.x,
          baseScale.current.y,
          baseScale.current.z
        );
        needsScaleResetOnJumpRef.current = false;
      }

      updateUp({
        ref,
        now,
        runtime: state.current,
        base: { baseY: baseY.current, baseScale: baseScale.current },
        cfg: {
          upMs: cfg.upMs,
          downMs: cfg.downMs,
          recoverMs: cfg.recoverMs,
          chargeScaleLerp: cfg.chargeScaleLerp,
          chargeSquashYMax: cfg.chargeSquashYMax,
          chargeStretchXZMax: cfg.chargeStretchXZMax,
        },
      });
      return;
    }

    if (state.current.phase === "down") {
      updateDown({
        ref,
        now,
        runtime: state.current,
        base: { baseY: baseY.current, baseScale: baseScale.current },
        cfg: {
          upMs: cfg.upMs,
          downMs: cfg.downMs,
          recoverMs: cfg.recoverMs,
          chargeScaleLerp: cfg.chargeScaleLerp,
          chargeSquashYMax: cfg.chargeSquashYMax,
          chargeStretchXZMax: cfg.chargeStretchXZMax,
        },
      });
      return;
    }

    if (state.current.phase === "recover") {
      updateRecover({
        ref,
        now,
        runtime: state.current,
        base: { baseY: baseY.current, baseScale: baseScale.current },
        cfg: {
          upMs: cfg.upMs,
          downMs: cfg.downMs,
          recoverMs: cfg.recoverMs,
          chargeScaleLerp: cfg.chargeScaleLerp,
          chargeSquashYMax: cfg.chargeSquashYMax,
          chargeStretchXZMax: cfg.chargeStretchXZMax,
        },
      });
    }
  });

  const isJumping = () => state.current.phase !== "idle";
  const getJumpHeight = () => state.current.height;
  const getHeightRange = () => ({
    min: cfg.baseHeight * cfg.minFactor,
    max: cfg.baseHeight * cfg.maxFactor,
  });
  const getChargeProgress = () =>
    computeChargeProgress(
      state.current.pressStartedAt,
      performance.now(),
      cfg.maxChargeMs,
      cfg.chargeKMs
    );
  const getLandingProgress = () => {
    if (state.current.lastLandingAt == null) return 0;
    const dt = performance.now() - state.current.lastLandingAt;
    if (dt <= 0) return 0;
    const p = Math.min(1, dt / cfg.landingFxMs);
    if (p >= 1) state.current.lastLandingAt = null;
    return p;
  };

  return {
    trigger,
    isJumping,
    getJumpHeight,
    getHeightRange,
    getChargeProgress,
    getLandingProgress,
  } as const;
}

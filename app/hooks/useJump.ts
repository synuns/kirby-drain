import { useCallback, useEffect, useRef } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";

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
};

const DEFAULTS: Required<UseJumpOptions> = {
  baseHeight: 2.4,
  upMs: 300,
  downMs: 300,
  recoverMs: 150,
  cooldownMs: 600,
  chargeKMs: 120,
  maxChargeMs: 1200,
  minFactor: 0.5,
  maxFactor: 3.0,
  chargeSquashYMax: 0.3,
  chargeStretchXZMax: 0.14,
  chargeScaleLerp: 0.28,
};

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function easeInQuad(t: number) {
  return t * t;
}

export function useJump(
  groupRef: React.RefObject<Group | null>,
  options?: UseJumpOptions
) {
  const cfg = { ...DEFAULTS, ...(options ?? {}) };
  const state = useRef<{
    phase: "idle" | "up" | "down" | "recover";
    start: number;
    cooldownUntil: number;
    height: number;
    pressStartedAt: number | null;
  }>({
    phase: "idle",
    start: 0,
    cooldownUntil: 0,
    height: cfg.baseHeight,
    pressStartedAt: null,
  });
  const baseScale = useRef({ x: 1, y: 1, z: 1 });
  const baseY = useRef(0);

  const trigger = useCallback(() => {
    const now = performance.now();
    if (now < state.current.cooldownUntil) return false;
    if (state.current.phase !== "idle") return false;
    state.current.phase = "up";
    state.current.start = now;
    state.current.cooldownUntil = now + cfg.cooldownMs;
    return true;
  }, [cfg.cooldownMs]);

  useEffect(() => {
    const startPress = () => {
      // 점프 진행 중에는 차지 시작 금지
      if (state.current.phase !== "idle") return;
      if (state.current.pressStartedAt == null) {
        state.current.pressStartedAt = performance.now();
      }
    };
    const endPress = () => {
      // 점프 진행 중에는 차지 종료 처리/트리거 금지
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
      // 로그 기반 맵핑: u in [0,1]
      const denom = Math.log1p(cfg.maxChargeMs / cfg.chargeKMs);
      const u = denom > 0 ? Math.log1p(heldMs / cfg.chargeKMs) / denom : 0;
      const clampedU = Math.max(0, Math.min(1, u));
      const factor = cfg.minFactor + (cfg.maxFactor - cfg.minFactor) * clampedU;
      state.current.height = cfg.baseHeight * factor;
      trigger();
    };

    let spaceHeld = false;
    const onPointerDown = () => startPress();
    const onPointerUp = () => endPress();
    const onTouchStart = () => startPress();
    const onTouchEnd = () => endPress();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (spaceHeld) return;
      spaceHeld = true;
      startPress();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      spaceHeld = false;
      endPress();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("touchstart", onTouchStart, {
      passive: true,
    } as any);
    window.addEventListener("touchend", onTouchEnd as any);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("touchstart", onTouchStart as any);
      window.removeEventListener("touchend", onTouchEnd as any);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    trigger,
    cfg.baseHeight,
    cfg.chargeKMs,
    cfg.maxChargeMs,
    cfg.minFactor,
    cfg.maxFactor,
  ]);

  useFrame(() => {
    const ref = groupRef.current;
    if (!ref) return;
    const now = performance.now();
    if (state.current.phase === "idle") {
      const charging = state.current.pressStartedAt != null;
      if (!charging) {
        baseScale.current = { x: ref.scale.x, y: ref.scale.y, z: ref.scale.z };
      }
      baseY.current = ref.position.y;

      if (charging) {
        const heldMs = Math.min(
          cfg.maxChargeMs,
          now - (state.current.pressStartedAt as number)
        );
        const denom = Math.log1p(cfg.maxChargeMs / cfg.chargeKMs);
        const u = denom > 0 ? Math.log1p(heldMs / cfg.chargeKMs) / denom : 0;
        const clampedU = Math.max(0, Math.min(1, u));
        const yTarget =
          baseScale.current.y * (1 - cfg.chargeSquashYMax * clampedU);
        const xzFactor = 1 + cfg.chargeStretchXZMax * clampedU;
        const xTarget = baseScale.current.x * xzFactor;
        const zTarget = baseScale.current.z * xzFactor;

        ref.scale.y += (yTarget - ref.scale.y) * cfg.chargeScaleLerp;
        ref.scale.x += (xTarget - ref.scale.x) * cfg.chargeScaleLerp;
        ref.scale.z += (zTarget - ref.scale.z) * cfg.chargeScaleLerp;
      } else {
        ref.scale.x +=
          (baseScale.current.x - ref.scale.x) * cfg.chargeScaleLerp;
        ref.scale.y +=
          (baseScale.current.y - ref.scale.y) * cfg.chargeScaleLerp;
        ref.scale.z +=
          (baseScale.current.z - ref.scale.z) * cfg.chargeScaleLerp;
      }
      return;
    }

    const elapsed = now - state.current.start;
    if (state.current.phase === "up") {
      const t = Math.min(1, elapsed / cfg.upMs);
      const y = easeOutQuad(t) * state.current.height;
      ref.position.y = baseY.current + y;
      // 스쿼시/스트레치
      ref.scale.y = baseScale.current.y * (1.0 + 0.08 * t);
      ref.scale.x = baseScale.current.x * (1.0 - 0.05 * t);
      ref.scale.z = baseScale.current.z * (1.0 - 0.05 * t);
      if (t >= 1) {
        state.current.phase = "down";
        state.current.start = now;
      }
      return;
    }

    if (state.current.phase === "down") {
      const t = Math.min(1, elapsed / cfg.downMs);
      const y = (1 - easeInQuad(t)) * state.current.height;
      ref.position.y = baseY.current + y;
      // 착지 직전 약간의 압축 준비
      ref.scale.y = baseScale.current.y * (1.08 - 0.18 * t);
      ref.scale.x = baseScale.current.x * (0.95 + 0.05 * t);
      ref.scale.z = baseScale.current.z * (0.95 + 0.05 * t);
      if (t >= 1) {
        state.current.phase = "recover";
        state.current.start = now;
      }
      return;
    }

    if (state.current.phase === "recover") {
      const t = Math.min(1, elapsed / cfg.recoverMs);
      ref.position.y = baseY.current;
      ref.scale.y = baseScale.current.y * (0.9 + 0.1 * t);
      ref.scale.x = baseScale.current.x * (1.05 - 0.05 * t);
      ref.scale.z = baseScale.current.z * (1.05 - 0.05 * t);
      if (t >= 1) {
        state.current.phase = "idle";
      }
    }
  });

  const isJumping = () => state.current.phase !== "idle";

  return { trigger, isJumping } as const;
}

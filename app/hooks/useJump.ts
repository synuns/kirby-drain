import { useCallback, useEffect, useRef } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";

type UseJumpOptions = {
  height?: number; // 점프 최대 높이
  upMs?: number; // 상승 시간(ms)
  downMs?: number; // 하강 시간(ms)
  recoverMs?: number; // 착지 후 복귀(ms)
  cooldownMs?: number; // 재입력 쿨다운(ms)
};

const DEFAULTS: Required<UseJumpOptions> = {
  height: 1.2,
  upMs: 300,
  downMs: 300,
  recoverMs: 150,
  cooldownMs: 600,
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
  }>({
    phase: "idle",
    start: 0,
    cooldownUntil: 0,
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
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") trigger();
    };
    const onClick = () => trigger();
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [trigger]);

  useFrame(() => {
    const ref = groupRef.current;
    if (!ref) return;
    const now = performance.now();
    if (state.current.phase === "idle") {
      baseScale.current = { x: ref.scale.x, y: ref.scale.y, z: ref.scale.z };
      baseY.current = ref.position.y;
      return;
    }

    const elapsed = now - state.current.start;
    if (state.current.phase === "up") {
      const t = Math.min(1, elapsed / cfg.upMs);
      const y = easeOutQuad(t) * cfg.height;
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
      const y = (1 - easeInQuad(t)) * cfg.height;
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

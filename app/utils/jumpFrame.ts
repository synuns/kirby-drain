import type { Group } from "three";
import { easeInQuad, easeOutQuad } from "./jumpEasing";
import { advancePhase } from "./jumpPhases";

export type JumpRuntime = {
  phase: "idle" | "up" | "down" | "recover";
  start: number;
  height: number;
  lastLandingAt: number | null;
};

export type JumpBase = {
  baseY: number;
  baseScale: { x: number; y: number; z: number };
};

export type JumpConfig = {
  upMs: number;
  downMs: number;
  recoverMs: number;
  chargeScaleLerp: number;
  chargeSquashYMax: number;
  chargeStretchXZMax: number;
};

export function updateIdle(
  ref: Group,
  runtime: JumpRuntime,
  base: JumpBase,
  cfg: JumpConfig,
  now: number,
  pressStartedAt: number | null
) {
  const charging = pressStartedAt != null;
  if (!charging) {
    base.baseScale = { x: ref.scale.x, y: ref.scale.y, z: ref.scale.z };
  }
  base.baseY = ref.position.y;
  if (charging) {
    const heldMs = Math.min(
      now - (pressStartedAt as number),
      Number.MAX_SAFE_INTEGER
    );
    const denom = 1; // 시각 피드백만, 실제 맵핑은 외부에서 처리
    const u = Math.max(0, Math.min(1, heldMs / (denom || 1)));
    const yTarget = base.baseScale.y * (1 - cfg.chargeSquashYMax * u);
    const xzFactor = 1 + cfg.chargeStretchXZMax * u;
    const xTarget = base.baseScale.x * xzFactor;
    const zTarget = base.baseScale.z * xzFactor;
    ref.scale.y += (yTarget - ref.scale.y) * cfg.chargeScaleLerp;
    ref.scale.x += (xTarget - ref.scale.x) * cfg.chargeScaleLerp;
    ref.scale.z += (zTarget - ref.scale.z) * cfg.chargeScaleLerp;
  } else {
    ref.scale.x += (base.baseScale.x - ref.scale.x) * cfg.chargeScaleLerp;
    ref.scale.y += (base.baseScale.y - ref.scale.y) * cfg.chargeScaleLerp;
    ref.scale.z += (base.baseScale.z - ref.scale.z) * cfg.chargeScaleLerp;
  }
}

export function updateUp(
  ref: Group,
  runtime: JumpRuntime,
  base: JumpBase,
  cfg: JumpConfig,
  now: number
) {
  const elapsed = now - runtime.start;
  const t = Math.min(1, elapsed / cfg.upMs);
  const y = easeOutQuad(t) * runtime.height;
  ref.position.y = base.baseY + y;
  ref.scale.y = base.baseScale.y * (1.0 + 0.08 * t);
  ref.scale.x = base.baseScale.x * (1.0 - 0.05 * t);
  ref.scale.z = base.baseScale.z * (1.0 - 0.05 * t);
  const adv = advancePhase(
    "up",
    now,
    runtime.start,
    cfg.upMs,
    cfg.downMs,
    cfg.recoverMs
  );
  if (adv) {
    runtime.phase = adv.next;
    runtime.start = adv.nextStart;
  }
}

export function updateDown(
  ref: Group,
  runtime: JumpRuntime,
  base: JumpBase,
  cfg: JumpConfig,
  now: number
) {
  const elapsed = now - runtime.start;
  const t = Math.min(1, elapsed / cfg.downMs);
  const y = (1 - easeInQuad(t)) * runtime.height;
  ref.position.y = base.baseY + y;
  ref.scale.y = base.baseScale.y * (1.08 - 0.18 * t);
  ref.scale.x = base.baseScale.x * (0.95 + 0.05 * t);
  ref.scale.z = base.baseScale.z * (0.95 + 0.05 * t);
  const adv = advancePhase(
    "down",
    now,
    runtime.start,
    cfg.upMs,
    cfg.downMs,
    cfg.recoverMs
  );
  if (adv) {
    runtime.phase = adv.next;
    runtime.start = adv.nextStart;
    runtime.lastLandingAt = now;
  }
}

export function updateRecover(
  ref: Group,
  runtime: JumpRuntime,
  base: JumpBase,
  cfg: JumpConfig,
  now: number
) {
  const elapsed = now - runtime.start;
  const t = Math.min(1, elapsed / cfg.recoverMs);
  ref.position.y = base.baseY;
  ref.scale.y = base.baseScale.y * (0.9 + 0.1 * t);
  ref.scale.x = base.baseScale.x * (1.05 - 0.05 * t);
  ref.scale.z = base.baseScale.z * (1.05 - 0.05 * t);
  const adv = advancePhase(
    "recover",
    now,
    runtime.start,
    cfg.upMs,
    cfg.downMs,
    cfg.recoverMs
  );
  if (adv) {
    runtime.phase = adv.next;
  }
}

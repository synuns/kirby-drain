import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useRef } from "react";
import {
  DEFAULT_BOING_SCALE,
  type BoingScaleOptions,
} from "~/constants/boingScale";

export function useBoingScale(
  groupRef: React.RefObject<Group | null>,
  getSignedVy: () => number,
  getNearGround: () => boolean,
  options?: Partial<BoingScaleOptions>
) {
  const cfg: BoingScaleOptions = { ...DEFAULT_BOING_SCALE, ...(options ?? {}) };
  const baseScaleRef = useRef<{ x: number; y: number; z: number } | null>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    if (!baseScaleRef.current) {
      baseScaleRef.current = {
        x: group.scale.x,
        y: group.scale.y,
        z: group.scale.z,
      };
    }
    const base = baseScaleRef.current;
    const vSignedY = getSignedVy();
    const nearGround = getNearGround();
    const vNorm = Math.min(1, Math.abs(vSignedY) * cfg.velToAmount);
    const gBoost = nearGround ? 1 : 0.6;
    const amt = Math.min(1, vNorm * gBoost);

    let targetX = base.x;
    let targetY = base.y;
    let targetZ = base.z;
    if (amt > 0) {
      const descendingOrGround = nearGround || vSignedY < 0;
      if (descendingOrGround) {
        // 착지 스쿼시
        targetY = base.y * (1 - cfg.ySquashMax * amt);
        const xz = 1 + cfg.xzStretchMax * amt;
        targetX = base.x * xz;
        targetZ = base.z * xz;
      } else {
        // 상승 스트레치
        targetY = base.y * (1 + cfg.yStretchMax * amt);
        const xz = 1 - cfg.xzSquashMax * amt;
        targetX = base.x * xz;
        targetZ = base.z * xz;
      }
    }

    group.scale.x += (targetX - group.scale.x) * cfg.scaleLerp;
    group.scale.y += (targetY - group.scale.y) * cfg.scaleLerp;
    group.scale.z += (targetZ - group.scale.z) * cfg.scaleLerp;

    const clamp = (v: number, lo: number, hi: number) =>
      Math.min(hi, Math.max(lo, v));
    group.scale.x = clamp(
      group.scale.x,
      base.x * cfg.clampMin,
      base.x * cfg.clampMax
    );
    group.scale.y = clamp(
      group.scale.y,
      base.y * cfg.clampMin,
      base.y * cfg.clampMax
    );
    group.scale.z = clamp(
      group.scale.z,
      base.z * cfg.clampMin,
      base.z * cfg.clampMax
    );
  });
}

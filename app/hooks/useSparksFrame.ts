import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Material,
  PointsMaterial,
  Vector3,
} from "three";
import type { SparkParticle } from "~/hooks/useSparksPool";
import { integrateParticles, spawnBurst } from "~/utils/sparksSpawn";

type UseSparksFrameParams = {
  groupRef: React.RefObject<Group | null>;
  poolRef: React.MutableRefObject<SparkParticle[]>;
  positions: Float32Array;
  geom: BufferGeometry;
  material: PointsMaterial & Material;
  lifetimeMs: number;
  speed: number;
  burst: number;
  count: number;
  gravity: number;
  getApexTrigger: () => boolean;
  getSpawnWorldPosition?: () => [number, number, number] | null;
  anchorWorldRef: React.MutableRefObject<Vector3 | null>;
  lastBurstAtRef: React.MutableRefObject<number | null>;
};

export function useSparksFrame(params: UseSparksFrameParams) {
  const {
    groupRef,
    poolRef,
    positions,
    geom,
    material,
    lifetimeMs,
    speed,
    burst,
    count,
    gravity,
    getApexTrigger,
    getSpawnWorldPosition,
    anchorWorldRef,
    lastBurstAtRef,
  } = params;

  useFrame((_, dt) => {
    if (anchorWorldRef.current && groupRef.current && groupRef.current.parent) {
      const parent = groupRef.current.parent;
      const local = parent.worldToLocal(anchorWorldRef.current.clone());
      groupRef.current.position.copy(local);
    }

    if (getApexTrigger()) {
      const now = performance.now();
      if (getSpawnWorldPosition) {
        const w = getSpawnWorldPosition();
        if (w) {
          anchorWorldRef.current = new Vector3(w[0], w[1], w[2]);
        }
      }
      const target = Math.max(1, Math.min(burst, count));
      spawnBurst(poolRef.current, target, now, speed);
      lastBurstAtRef.current = now;
    }

    const now = performance.now();
    integrateParticles(
      poolRef.current,
      positions,
      now,
      dt,
      lifetimeMs,
      gravity
    );

    if (lastBurstAtRef.current != null) {
      const age = now - lastBurstAtRef.current;
      const lifeT = Math.max(0, Math.min(1, age / lifetimeMs));
      material.opacity = 1 - lifeT;
    }

    const pos = geom.getAttribute("position") as BufferAttribute | undefined;
    if (pos) pos.needsUpdate = true;
  });
}

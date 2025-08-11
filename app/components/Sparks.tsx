import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  Group,
  Points,
  PointsMaterial,
  Vector3,
} from "three";
import { SPARKS_DEFAULT } from "~/constants/sparksConfig";
import { useSparksGeometry, useSparksPool } from "~/hooks/useSparksPool";
import { useRebuildSparksPool } from "~/hooks/useSparksEffects";
import { useSparksFrame } from "~/hooks/useSparksFrame";

type SparksProps = {
  getApexTrigger: () => boolean; // true 한 프레임 동안 발생 시 스폰
  count?: number;
  lifetimeMs?: number;
  speed?: number;
  color?: string;
  size?: number;
  origin?: [number, number, number]; // 로컬 기준 스폰 오프셋
  burst?: number; // 트리거 1회당 동시에 스폰할 개수
  getSpawnWorldPosition?: () => [number, number, number] | null; // 스폰 시 고정할 월드 좌표
};

const DEFAULTS: Required<Omit<SparksProps, "getApexTrigger">> = {
  count: 24,
  lifetimeMs: SPARKS_DEFAULT.lifetimeMs,
  speed: SPARKS_DEFAULT.speed,
  color: SPARKS_DEFAULT.color,
  size: SPARKS_DEFAULT.size,
  origin: SPARKS_DEFAULT.origin as [number, number, number],
  burst: SPARKS_DEFAULT.burst,
  getSpawnWorldPosition: () => null,
};

export function Sparks(props: SparksProps) {
  const cfg = { ...DEFAULTS, ...props };
  const { geom, positions } = useSparksGeometry(cfg.count);
  const material = useMemo(
    () =>
      new PointsMaterial({
        size: cfg.size,
        color: new Color(cfg.color),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [cfg.color, cfg.size]
  );
  const pointsRef = useRef<Points>(null);
  const groupRef = useRef<Group>(null);
  const anchorWorldRef = useRef<Vector3 | null>(null);
  const lastBurstAtRef = useRef<number | null>(null);

  const pool = useSparksPool(cfg.count);
  useRebuildSparksPool(pool, cfg.count);

  useSparksFrame({
    groupRef,
    poolRef: pool,
    positions,
    geom,
    material,
    lifetimeMs: cfg.lifetimeMs,
    speed: cfg.speed,
    burst: cfg.burst,
    count: cfg.count,
    gravity: SPARKS_DEFAULT.gravity,
    getApexTrigger: props.getApexTrigger,
    getSpawnWorldPosition: props.getSpawnWorldPosition,
    anchorWorldRef,
    lastBurstAtRef,
  });

  return (
    <group ref={groupRef} position={cfg.origin ?? [0, 0, 0]}>
      <points ref={pointsRef} geometry={geom} material={material} />
    </group>
  );
}

import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Vector3 } from "three";

export type SparkParticle = {
  pos: Vector3;
  vel: Vector3;
  born: number;
  alive: boolean;
};

export function useSparksGeometry(count: number) {
  const geom = useMemo(() => new BufferGeometry(), []);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  useEffect(() => {
    geom.setAttribute("position", new BufferAttribute(positions, 3));
  }, [geom, positions]);
  return { geom, positions } as const;
}

export function useSparksPool(count: number) {
  const poolRef = useRef<SparkParticle[]>(
    Array.from({ length: count }, () => ({
      pos: new Vector3(0, 0, 0),
      vel: new Vector3(),
      born: 0,
      alive: false,
    }))
  );

  useEffect(() => {
    poolRef.current = Array.from({ length: count }, () => ({
      pos: new Vector3(0, 0, 0),
      vel: new Vector3(),
      born: 0,
      alive: false,
    }));
  }, [count]);

  return poolRef;
}

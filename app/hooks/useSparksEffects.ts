import { useEffect } from "react";
import { Vector3 } from "three";
import type { SparkParticle } from "~/hooks/useSparksPool";

export function useRebuildSparksPool(
  poolRef: React.MutableRefObject<SparkParticle[]>,
  count: number
) {
  useEffect(() => {
    poolRef.current = Array.from({ length: count }, () => ({
      pos: new Vector3(0, 0, 0),
      vel: new Vector3(),
      born: 0,
      alive: false,
    }));
  }, [count]);
}

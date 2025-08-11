import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

export function useApexTrigger(groupRef: React.RefObject<Group | null>) {
  const prevY = useRef<number | null>(null);
  const prevVy = useRef<number>(0);
  const fire = useRef<boolean>(false);

  useFrame(() => {
    const y = groupRef.current?.position.y ?? 0;
    if (prevY.current !== null) {
      const vy = y - prevY.current;
      if (prevVy.current > 0 && vy <= 0) {
        fire.current = true;
      }
      prevVy.current = vy;
    }
    prevY.current = y;
  });

  const getAndReset = () => {
    const f = fire.current;
    fire.current = false;
    return f;
  };

  return { getAndReset } as const;
}

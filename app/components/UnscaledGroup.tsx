import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Vector3 as Vector3Type } from "three";
import { Vector3 } from "three";

type UnscaledGroupProps = {
  parentRef: React.RefObject<Group | null>;
  children: React.ReactNode;
};

export function UnscaledGroup({ parentRef, children }: UnscaledGroupProps) {
  const groupRef = useRef<Group>(null);
  const worldScale = useRef<Vector3Type>(new Vector3(1, 1, 1));

  useFrame(() => {
    const parent = parentRef.current;
    const group = groupRef.current;
    if (!parent || !group) return;
    parent.getWorldScale(worldScale.current);
    const sx = worldScale.current.x !== 0 ? 1 / worldScale.current.x : 1;
    const sy = worldScale.current.y !== 0 ? 1 / worldScale.current.y : 1;
    const sz = worldScale.current.z !== 0 ? 1 / worldScale.current.z : 1;
    group.scale.set(sx, sy, sz);
  });

  return <group ref={groupRef}>{children}</group>;
}

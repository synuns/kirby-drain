import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { useMouseFollow } from "./useMouseFollow";

export function useModelRotation() {
  const modelRef = useRef<Group>(null);
  const mousePosition = useMouseFollow();

  useFrame((state, delta) => {
    if (modelRef.current) {
      const targetRotationY = mousePosition.x * Math.PI * 0.5;
      const targetRotationX = -mousePosition.y * Math.PI * 0.5;

      modelRef.current.rotation.y +=
        (targetRotationY - modelRef.current.rotation.y) * 0.05;
      modelRef.current.rotation.x +=
        (targetRotationX - modelRef.current.rotation.x) * 0.05;
    }
  });

  return modelRef;
}

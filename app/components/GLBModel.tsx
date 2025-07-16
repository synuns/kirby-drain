import { useLoader } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

interface GLBModelProps {
  modelPath: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

export function GLBModel({
  modelPath,
  autoRotate = true,
  rotationSpeed = 0.5,
}: GLBModelProps) {
  const gltf = useLoader(GLTFLoader, modelPath);
  const modelRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (modelRef.current && autoRotate) {
      modelRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={modelRef}>
      <primitive object={gltf.scene} />
    </group>
  );
}

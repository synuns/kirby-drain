import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useModelRotation } from "~/hooks/useModelRotation";
import type { Group } from "three";
import { useJump } from "~/hooks/useJump";

interface GLBModelProps {
  modelPath: string;
}

const initialRotation = [0, Math.PI / 10, 0] as const;

export function GLBModel({ modelPath }: GLBModelProps) {
  const gltf = useLoader(GLTFLoader, modelPath);
  const modelRef = useModelRotation();
  useJump(modelRef);

  return (
    <group ref={modelRef} rotation={initialRotation}>
      <primitive object={gltf.scene} />
    </group>
  );
}

import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useModelRotation } from "~/hooks/useModelRotation";
import { useJump } from "~/hooks/useJump";
import { useProximityBounce } from "~/hooks/useProximityBounce";

interface GLBModelProps {
  modelPath: string;
}

const initialRotation = [0, Math.PI / 10, 0] as const;

export function GLBModel({ modelPath }: GLBModelProps) {
  const gltf = useLoader(GLTFLoader, modelPath);
  const modelRef = useModelRotation();
  useJump(modelRef);
  useProximityBounce(modelRef, {
    nearRadius: 0.28,
    maxForward: 0.55,
    stiffness: 140,
    damping: 8,
  });

  return (
    <group ref={modelRef} rotation={initialRotation}>
      <primitive object={gltf.scene} />
    </group>
  );
}

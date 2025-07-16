import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useModelRotation } from "~/hooks/useModelRotation";

interface GLBModelProps {
  modelPath: string;
}

const initialRotation = [0, Math.PI / 10, 0] as const;

export function GLBModel({ modelPath }: GLBModelProps) {
  const gltf = useLoader(GLTFLoader, modelPath);
  const modelRef = useModelRotation();

  return (
    <group ref={modelRef} rotation={initialRotation}>
      <primitive object={gltf.scene} />
    </group>
  );
}

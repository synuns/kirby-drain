import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { GLBModel, GLBModelProps } from "./GLBModel";
import { useRef, useState } from "react";
import { InitialDrop } from "./InitialDrop";
import { ShiningStars } from "./ShiningStars";
import { useInhaleInput } from "~/hooks/useInhaleInput";
import { Group } from "three";

interface ModelViewerProps {
  modelPath: string;
}

export function ModelViewer({ modelPath }: ModelViewerProps) {
  const [initialPosition, setInitialPosition] = useState<
    [number, number, number] | null
  >(null);
  const isSucking = useInhaleInput();
  const kirbyRef = useRef<Group>(null);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        touchAction: "none",
        overscrollBehavior: "contain",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          WebkitTouchCallout: "none",
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        <Environment preset="sunset" />

        <ShiningStars
          modelPath="/assets/models/shining-star.glb"
          isSucking={isSucking}
          kirbyRef={kirbyRef}
        />
        {!initialPosition && (
          <InitialDrop
            modelPath={modelPath}
            startY={8}
            radius={0.9}
            gravity={[0, -20, 0]}
            onComplete={(pos) => setInitialPosition([pos[0], pos[1], pos[2]])}
          />
        )}
        {initialPosition && (
          <group position={initialPosition} ref={kirbyRef}>
            <GLBModel modelPath={modelPath} isSucking={isSucking} />
          </group>
        )}
      </Canvas>
    </div>
  );
}

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { GLBModel } from "./GLBModel";

interface ModelViewerProps {
  modelPath: string;
}

export function ModelViewer({ modelPath }: ModelViewerProps) {
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

        <GLBModel modelPath={modelPath} />
      </Canvas>
    </div>
  );
}

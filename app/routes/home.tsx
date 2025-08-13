import type { Route } from "./+types/home";
import { ModelViewer } from "../components/ModelViewer";
import { MotionPermissionGate } from "../components/MotionPermissionGate";
import { WebGLGuard } from "~/components/WebGLGuard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Kirby Drain - 3D Model Viewer" },
    {
      name: "description",
      content: "3D Kirby Drain model viewer using Three.js",
    },
  ];
}

export default function Home() {
  return (
    <WebGLGuard>
      <MotionPermissionGate>
        <ModelViewer modelPath="/assets/models/kirby-drain.glb" />
      </MotionPermissionGate>
    </WebGLGuard>
  );
}

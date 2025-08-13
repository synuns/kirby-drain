import type { Route } from "./+types/home";
import { ModelViewer } from "../components/ModelViewer";
import { MotionPermissionGate } from "../components/MotionPermissionGate";
import { WebGLGuard } from "~/components/WebGLGuard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Kirby Drain" },
    {
      name: "description",
      content: "Enjoy 3D Kirby with interactions ",
    },
    { name: "theme-color", content: "#d74894" },
    { property: "og:title", content: "Kirby Drain" },
    { property: "og:description", content: "Enjoy 3D Kirby with interactions" },
    { property: "og:type", content: "website" },
    {
      name: "og:image",
      content: "/assets/images/kirby-drain.png",
    },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Kirby Drain" },
    {
      name: "twitter:description",
      content: "Enjoy 3D Kirby with interactions",
    },
    { name: "twitter:image", content: "/assets/images/kirby-drain.png" },
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

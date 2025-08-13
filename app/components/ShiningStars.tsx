import { useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Group, MathUtils, Vector3 } from "three";
import { useMemo, useRef } from "react";
import type { ShiningStarsConfig } from "~/constants/shiningStarConfig";
import { SHINING_STARS_DEFAULT } from "~/constants/shiningStarConfig";

type StarInstance = {
  position: [number, number, number];
  scale: number;
  rotationSpeed: number;
};

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function generateStars(cfg: ShiningStarsConfig) {
  const rand = seededRandom(cfg.seed);
  const stars: StarInstance[] = [];
  for (let i = 0; i < cfg.count; i++) {
    const radius = MathUtils.lerp(
      cfg.radiusRange[0],
      cfg.radiusRange[1],
      rand()
    );
    const angle = rand() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = MathUtils.lerp(cfg.yRange[0], cfg.yRange[1], rand());
    const z = MathUtils.lerp(cfg.zRange[0], cfg.zRange[1], rand());
    const scale = MathUtils.lerp(cfg.scaleRange[0], cfg.scaleRange[1], rand());
    const rotationSpeed = MathUtils.lerp(
      cfg.rotationSpeedRange[0],
      cfg.rotationSpeedRange[1],
      rand()
    );
    stars.push({ position: [x, y, z], scale, rotationSpeed });
  }
  return stars;
}

export type ShiningStarsProps = Partial<ShiningStarsConfig> & {
  center?: [number, number, number];
};

export function ShiningStars(props: ShiningStarsProps) {
  const cfg: ShiningStarsConfig = { ...SHINING_STARS_DEFAULT, ...props };
  const gltf = useLoader(GLTFLoader, cfg.modelPath);
  const groupRef = useRef<Group>(null);

  const stars = useMemo(
    () => generateStars(cfg),
    [
      cfg.count,
      cfg.seed,
      cfg.radiusRange[0],
      cfg.radiusRange[1],
      cfg.yRange[0],
      cfg.yRange[1],
      cfg.zRange[0],
      cfg.zRange[1],
      cfg.scaleRange[0],
      cfg.scaleRange[1],
      cfg.rotationSpeedRange[0],
      cfg.rotationSpeedRange[1],
    ]
  );

  const center = useMemo(() => {
    const c = props.center ?? [0, 0, 0];
    return new Vector3(c[0], c[1], c[2]);
  }, [props.center]);

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group) return;
    group.children.forEach((child, idx) => {
      const s = stars[idx];
      child.rotation.y += s.rotationSpeed * dt;
      child.rotation.x += s.rotationSpeed * 0.5 * dt;
    });
  });

  return (
    <group
      ref={groupRef}
      position={center.toArray() as [number, number, number]}
    >
      {stars.map((s, i) => (
        <group key={i} position={s.position} scale={s.scale}>
          <primitive object={gltf.scene.clone()} />
        </group>
      ))}
    </group>
  );
}

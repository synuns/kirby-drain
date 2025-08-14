import { useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Group, MathUtils, Vector3 } from "three";
import { useMemo, useRef, useState, RefObject } from "react";
import type { ShiningStarsConfig } from "~/constants/shiningStarConfig";
import { SHINING_STARS_DEFAULT } from "~/constants/shiningStarConfig";

type StarInstance = {
  id: number;
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
    stars.push({ id: i, position: [x, y, z], scale, rotationSpeed });
  }
  return stars;
}

export type ShiningStarsProps = Partial<ShiningStarsConfig> & {
  center?: [number, number, number];
  isSucking: boolean;
  kirbyRef: RefObject<Group>;
};

export function ShiningStars(props: ShiningStarsProps) {
  const cfg: ShiningStarsConfig = { ...SHINING_STARS_DEFAULT, ...props };
  const gltf = useLoader(GLTFLoader, cfg.modelPath);
  const groupRef = useRef<Group>(null);

  const [stars, setStars] = useState(() => generateStars(cfg));

  const center = useMemo(() => {
    const c = props.center ?? [0, 0, 0];
    return new Vector3(c[0], c[1], c[2]);
  }, [props.center]);

  useFrame((state, dt) => {
    const group = groupRef.current;
    const kirby = props.kirbyRef.current;
    if (!group || !kirby) return;

    const capturedStarIds: number[] = [];

    if (props.isSucking) {
      const kirbyPos = kirby.getWorldPosition(new Vector3());
      const INHALE_RADIUS = 8;
      const CAPTURE_DISTANCE = 0.5;

      group.children.forEach((child, idx) => {
        const starData = stars[idx];
        if (!starData) return;

        const starPos = child.getWorldPosition(new Vector3());
        const distance = starPos.distanceTo(kirbyPos);

        if (distance < INHALE_RADIUS) {
          const direction = kirbyPos.clone().sub(starPos).normalize();
          const speed = Math.max(0, (INHALE_RADIUS - distance)) * 2;
          child.position.add(direction.multiplyScalar(speed * dt));

          if (distance < CAPTURE_DISTANCE) {
            capturedStarIds.push(starData.id);
          }
        }
      });
    }

    if (capturedStarIds.length > 0) {
      setStars((prevStars) =>
        prevStars.filter((s) => !capturedStarIds.includes(s.id))
      );
    }

    // Default rotation
    group.children.forEach((child, idx) => {
      const s = stars[idx];
      if (!s) return;
      child.rotation.y += s.rotationSpeed * dt;
      child.rotation.x += s.rotationSpeed * 0.5 * dt;
    });
  });

  return (
    <group
      ref={groupRef}
      position={center.toArray() as [number, number, number]}
    >
      {stars.map((s) => (
        <group key={s.id} position={s.position} scale={s.scale}>
          <primitive object={gltf.scene.clone()} />
        </group>
      ))}
    </group>
  );
}

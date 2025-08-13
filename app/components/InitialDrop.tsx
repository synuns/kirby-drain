import { useEffect, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Physics, usePlane, useSphere } from "@react-three/cannon";
import type { Triplet } from "@react-three/cannon";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Group } from "three";
import { useBoingScale } from "~/hooks/useBoingScale";
import { useSettleDetector } from "~/hooks/useSettleDetector";

type InitialDropProps = {
  modelPath: string;
  startY?: number;
  radius?: number;
  gravity?: Triplet;
  onComplete: (finalPosition: Triplet) => void;
};

function Ground({ restitution = 0.7 }: { restitution?: number }) {
  usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: { restitution },
  }));
  return null;
}

function DroppingModel({
  modelPath,
  startY = 6,
  radius = 0.8,
  onSettle,
}: {
  modelPath: string;
  startY?: number;
  radius?: number;
  onSettle: (pos: Triplet) => void;
}) {
  const gltf = useLoader(GLTFLoader, modelPath);
  const velocityRef = useRef<[number, number, number]>([0, 0, 0]);
  const positionRef = useRef<[number, number, number]>([0, startY, 0]);
  const [ref, api] = useSphere<Group>(() => ({
    args: [radius],
    position: [0, startY, 0],
    mass: 1.2,
    material: { restitution: 0.6 },
    linearDamping: 0.12,
    angularDamping: 0.95,
    allowSleep: true,
  }));

  // 통통 튀는 느낌 강도 상수들
  const Y_SQUASH_MAX = 0.14; // 착지 시 Y 축 압축 최대 비율
  const XZ_STRETCH_MAX = 0.1; // 착지 시 XZ 축 신장 최대 비율
  const Y_STRETCH_MAX = 0.12; // 상승 시 Y 축 신장 최대 비율
  const XZ_SQUASH_MAX = 0.08; // 상승 시 XZ 축 압축 최대 비율
  const SCALE_LERP = 0.18; // 스케일 보간 정도(0~1)
  const VEL_TO_AMOUNT = 0.28; // 속도 → 양감 매핑 가중치

  const baseScaleRef = useRef<{ x: number; y: number; z: number } | null>(null);

  // 구독으로 현재 속도/위치 추적
  useEffect(
    () => api.velocity.subscribe((v) => (velocityRef.current = v as any)),
    [api.velocity]
  );
  useEffect(
    () => api.position.subscribe((p) => (positionRef.current = p as any)),
    [api.position]
  );

  // 정착 감지(모듈화 훅)
  useSettleDetector({
    radius,
    getSignedVy: () => velocityRef.current[1],
    getPosition: () => positionRef.current as any,
    onSettle: (pos) => onSettle(pos),
  });

  // 통통 튀는 스케일 보간(모듈화 훅)
  useBoingScale(
    ref as any,
    () => velocityRef.current[1],
    () => positionRef.current[1] <= radius + 0.02
  );

  return (
    <group ref={ref as any}>
      {gltf?.scene && <primitive object={gltf.scene} />}
    </group>
  );
}

export function InitialDrop({
  modelPath,
  startY = 6,
  radius = 0.8,
  gravity = [0, -18, 0],
  onComplete,
}: InitialDropProps) {
  const [done, setDone] = useState(false);

  if (done) return null;

  return (
    <Physics gravity={gravity}>
      <Ground restitution={0.72} />
      <DroppingModel
        modelPath={modelPath}
        startY={startY}
        radius={radius}
        onSettle={(pos) => {
          setDone(true);
          onComplete([pos[0], pos[1], pos[2]]);
        }}
      />
    </Physics>
  );
}

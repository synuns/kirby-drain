import { useEffect, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Physics, usePlane, useSphere } from "@react-three/cannon";
import type { Triplet } from "@react-three/cannon";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Group } from "three";

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

  // 정착 판정: 낮은 속도 + 지면 근접 상태가 잠시 지속되면 완료
  const settleTimerRef = useRef<number | null>(null);
  useFrame((_, dt) => {
    const vy = Math.abs(velocityRef.current[1]);
    const y = positionRef.current[1];
    const nearGround = y <= radius + 0.02; // 지면 접촉 근처
    const slow = vy < 0.05;
    if (nearGround && slow) {
      if (settleTimerRef.current == null) {
        settleTimerRef.current = 0;
      } else {
        settleTimerRef.current += dt;
        if (settleTimerRef.current > 0.28) {
          onSettle(positionRef.current);
        }
      }
    } else {
      settleTimerRef.current = null;
    }

    // 스쿼시/스트레치(속도/접지 기반)
    const group = ref.current as Group | null;
    if (!group) return;
    if (!baseScaleRef.current) {
      baseScaleRef.current = {
        x: group.scale.x,
        y: group.scale.y,
        z: group.scale.z,
      };
    }
    const base = baseScaleRef.current;
    const vSignedY = velocityRef.current[1];
    const vNorm = Math.min(1, Math.abs(vSignedY) * VEL_TO_AMOUNT);
    const gBoost = nearGround ? 1 : 0.6;
    const amt = Math.min(1, vNorm * gBoost);

    let targetX = base.x;
    let targetY = base.y;
    let targetZ = base.z;
    if (amt > 0) {
      const descendingOrGround = nearGround || vSignedY < 0;
      if (descendingOrGround) {
        // 착지 스쿼시: 아래로 떨어질 때 Y를 줄이고 XZ를 늘림
        targetY = base.y * (1 - Y_SQUASH_MAX * amt);
        const xz = 1 + XZ_STRETCH_MAX * amt;
        targetX = base.x * xz;
        targetZ = base.z * xz;
      } else {
        // 상승 스트레치: 위로 튈 때 Y를 늘리고 XZ를 줄임
        targetY = base.y * (1 + Y_STRETCH_MAX * amt);
        const xz = 1 - XZ_SQUASH_MAX * amt;
        targetX = base.x * xz;
        targetZ = base.z * xz;
      }
    }

    group.scale.x += (targetX - group.scale.x) * SCALE_LERP;
    group.scale.y += (targetY - group.scale.y) * SCALE_LERP;
    group.scale.z += (targetZ - group.scale.z) * SCALE_LERP;
    // 안전 클램프
    const clamp = (v: number, lo: number, hi: number) =>
      Math.min(hi, Math.max(lo, v));
    group.scale.x = clamp(group.scale.x, base.x * 0.7, base.x * 1.3);
    group.scale.y = clamp(group.scale.y, base.y * 0.7, base.y * 1.3);
    group.scale.z = clamp(group.scale.z, base.z * 0.7, base.z * 1.3);
  });

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

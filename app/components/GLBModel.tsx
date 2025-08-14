import { useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useModelRotation } from "~/hooks/useModelRotation";
import { useChargedSpin } from "~/hooks/useChargedSpin";
import { useJump } from "~/hooks/useJump";
import { useProximityBounce } from "~/hooks/useProximityBounce";
import { Sparks } from "./Sparks";
import { useApexTrigger } from "~/hooks/useApexTrigger";
import { useHaptics } from "~/hooks/useHaptics";
import { UnscaledGroup } from "./UnscaledGroup";
import { Box3, Vector3 } from "three";
import { useCallback, useEffect, useRef } from "react";
import { computeBurst, computeCount } from "~/utils/sparksScaling";
import { useAudio } from "~/hooks/useAudio";
import { useInhaleInput } from "~/hooks/useInhaleInput";

export interface GLBModelProps {
  modelPath: string;
  isSucking: boolean;
}

export function GLBModel({ modelPath, isSucking }: GLBModelProps) {
  const gltf = useLoader(GLTFLoader, modelPath);
  const rotationSuppressRef = useRef(false);
  const modelRef = useModelRotation({ suppressRef: rotationSuppressRef });
  const {
    getChargeProgress,
    getLandingProgress,
    getJumpHeight,
    getHeightRange,
    isJumping,
  } = useJump(modelRef);

  const spin = useChargedSpin({
    groupRef: modelRef,
    getChargeProgress,
    isJumping,
  });

  useHaptics({ getChargeProgress, getLandingProgress });

  const playJumpSound = useAudio("/assets/sounds/jump.mp3", 0.5);
  const playLandSound = useAudio("/assets/sounds/land.mp3", 0.5);
  const playInhaleSound = useAudio("/assets/sounds/inhale.mp3", 0.5);

  const wasJumping = useRef(false);
  const wasLanding = useRef(false);
  const wasSucking = useRef(false);

  useEffect(() => {
    const landingProgress = getLandingProgress();
    if (isJumping && !wasJumping.current) {
      playJumpSound();
    }
    if (landingProgress > 0 && !wasLanding.current) {
      playLandSound();
    }
    if (isSucking && !wasSucking.current) {
      playInhaleSound();
    }
    wasJumping.current = isJumping;
    wasLanding.current = landingProgress > 0;
    wasSucking.current = isSucking;
  }, [isJumping, getLandingProgress, playJumpSound, playLandSound, isSucking, playInhaleSound]);

  const { getAndReset } = useApexTrigger(modelRef);

  useProximityBounce(modelRef, {
    nearRadius: 0.28,
    maxForward: 0.55,
    stiffness: 140,
    damping: 8,
    getSuppressed: () => getChargeProgress() > 0,
  });

  const rippleLocalYRef = useRef(-0.05);
  const rippleComputedRef = useRef(false);

  const getSpawnWorldPosition = useCallback(() => {
    if (!gltf?.scene) return null;
    const box = new Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new Vector3());
    const HEAD_OFFSET = 0.12;
    return [center.x, box.max.y + HEAD_OFFSET, center.z] as [
      number,
      number,
      number
    ];
  }, [gltf]);

  useFrame(() => {
    if (rippleComputedRef.current) return;
    const parent = modelRef.current;
    if (!parent || !gltf?.scene) return;
    const parentWorldY = parent.getWorldPosition(new Vector3()).y;
    const box = new Box3().setFromObject(gltf.scene);
    const minWorldY = box.min.y;

    rippleLocalYRef.current = minWorldY - parentWorldY;

    rippleComputedRef.current = true;
  });

  // 스핀 중에는 입력 기반 모델 회전을 정지
  useFrame(() => {
    rotationSuppressRef.current = spin.isActive();
  });

  // 들이마시기 애니메이션
  useFrame(({ clock }) => {
    const model = modelRef.current;
    if (!model) return;

    if (isSucking) {
      const t = clock.getElapsedTime();
      const scale = 1 + Math.sin(t * 10) * 0.1;
      model.scale.set(scale, scale, scale);
    } else {
      // Reset scale when not sucking
      model.scale.lerp({ x: 1, y: 1, z: 1 } as Vector3, 0.1);
    }
  });

  const getBurst = useCallback(() => {
    const h = getJumpHeight();
    const range = getHeightRange();
    return computeBurst(h, range);
  }, [getJumpHeight, getHeightRange]);

  const getCount = useCallback(() => {
    const h = getJumpHeight();
    const range = getHeightRange();
    const b = getBurst();
    return computeCount(h, range, b);
  }, [getJumpHeight, getHeightRange, getBurst]);

  return (
    <group ref={modelRef}>
      <UnscaledGroup parentRef={modelRef}>
        <Sparks
          getApexTrigger={getAndReset}
          getSpawnWorldPosition={getSpawnWorldPosition}
          burst={getBurst()}
          count={getCount()}
        />
      </UnscaledGroup>
      <primitive object={gltf.scene} />
    </group>
  );
}

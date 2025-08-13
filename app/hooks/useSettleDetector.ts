import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Triplet } from "@react-three/cannon";

type UseSettleDetectorOptions = {
  radius: number;
  vyThreshold?: number;
  groundEpsilon?: number;
  duration?: number;
  getSignedVy: () => number;
  getPosition: () => Triplet;
  onSettle: (pos: Triplet) => void;
};

export function useSettleDetector({
  radius,
  vyThreshold = 0.05,
  groundEpsilon = 0.02,
  duration = 0.28,
  getSignedVy,
  getPosition,
  onSettle,
}: UseSettleDetectorOptions) {
  const timerRef = useRef<number | null>(null);

  useFrame((_, dt) => {
    const pos = getPosition();
    const vy = Math.abs(getSignedVy());
    const nearGround = pos[1] <= radius + groundEpsilon;
    const slow = vy < vyThreshold;

    if (nearGround && slow) {
      if (timerRef.current == null) {
        timerRef.current = 0;
      } else {
        timerRef.current += dt;
        if (timerRef.current > duration) {
          onSettle(pos);
        }
      }
    } else {
      timerRef.current = null;
    }
  });
}

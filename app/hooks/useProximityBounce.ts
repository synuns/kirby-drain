import { useRef } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { useMouseFollow } from "./useMouseFollow";

type UseProximityBounceOptions = {
  nearRadius?: number; // 마우스 정규화 공간에서 근접 판정 반경(0~sqrt(2)), 작을수록 엄격
  maxForward?: number; // 근접 시 앞으로 이동할 최대 z(+ 방향)
  stiffness?: number; // 스프링 강성 k
  damping?: number; // 감쇠 c
  getSuppressed?: () => boolean; // 외부 우선 동작(필요 시)
  // 띠용(boing) 효과용 파라미터
  impulseThreshold?: number; // t가 이 값을 넘을 때 1회성 임펄스 부여(0~1)
  impulseStrength?: number; // 임펄스 크기(속도에 가산)
  yStretchMax?: number; // 전진 시 세로 스트레치 최대 비율
  xzSquashMax?: number; // 전진 시 가로 스쿼시 최대 비율
  ySquashMax?: number; // 복귀 시 세로 스쿼시 최대 비율
  xzStretchMax?: number; // 복귀 시 가로 스트레치 최대 비율
  scaleLerp?: number; // 스케일 보간 정도(0~1)
  velToAmount?: number; // 속도 → 스케일 영향 가중치
};

const DEFAULTS: Required<UseProximityBounceOptions> = {
  nearRadius: 0.35,
  maxForward: 0.35,
  stiffness: 160,
  damping: 7,
  getSuppressed: () => false,
  impulseThreshold: 0.88,
  impulseStrength: 2.2,
  yStretchMax: 0.12,
  xzSquashMax: 0.08,
  ySquashMax: 0.1,
  xzStretchMax: 0.06,
  scaleLerp: 0.18,
  velToAmount: 0.35,
};

export function useProximityBounce(
  groupRef: React.RefObject<Group | null>,
  options?: UseProximityBounceOptions
) {
  const cfg = { ...DEFAULTS, ...(options ?? {}) };
  const state = useRef({ z: 0, v: 0, baseZ: 0, initialized: false, prevT: 0 });
  const initialScale = useRef<{ x: number; y: number; z: number } | null>(null);
  const { x, y } = useMouseFollow();

  useFrame((_, dt) => {
    const ref = groupRef.current;
    if (!ref) return;

    if (!state.current.initialized) {
      state.current.baseZ = ref.position.z;
      state.current.initialized = true;
      if (!initialScale.current) {
        initialScale.current = {
          x: ref.scale.x,
          y: ref.scale.y,
          z: ref.scale.z,
        };
      }
    }

    const suppressed = cfg.getSuppressed?.() ?? false;

    const dist = Math.hypot(x, y); // 0(중앙) ~ ~1.4(코너)
    let t = 0;
    if (!suppressed) {
      const raw = 1 - Math.min(1, dist / cfg.nearRadius);
      // 부드러운 반응을 위한 smoothstep
      t = raw * raw * (3 - 2 * raw);
    }
    const target = t * cfg.maxForward;

    // 스프링 통합(z축만)
    const k = cfg.stiffness;
    const c = cfg.damping;
    const xz = state.current.z - target; // 변위(목표 대비)
    const a = -k * xz - c * state.current.v;
    state.current.v += a * dt;
    state.current.z += state.current.v * dt;

    ref.position.z = state.current.baseZ + state.current.z;

    // 임펄스: 근접 임계치 돌파 시 1회 속도 부스팅(띠용감)
    if (
      state.current.prevT < cfg.impulseThreshold &&
      t >= cfg.impulseThreshold &&
      !suppressed
    ) {
      state.current.v += cfg.impulseStrength;
    }
    state.current.prevT = t;

    // 스쿼시/스트레치: 속도와 근접 정도 기반(초기 스케일을 기준으로 계산)
    if (initialScale.current) {
      const base = initialScale.current;
      const sNorm = Math.min(
        1,
        Math.abs(state.current.z) / Math.max(0.0001, cfg.maxForward)
      );
      const vNorm = Math.min(1, Math.abs(state.current.v) * cfg.velToAmount);
      const amt = suppressed ? 0 : Math.min(1, 0.4 * sNorm + 0.6 * vNorm);
      const forward = state.current.v >= 0; // +z로 전진 중

      let targetX = base.x;
      let targetY = base.y;
      let targetZ = base.z;
      if (amt > 0) {
        if (forward) {
          targetY = base.y * (1 + cfg.yStretchMax * amt);
          const xzFactor = 1 - cfg.xzSquashMax * amt;
          targetX = base.x * xzFactor;
          targetZ = base.z * xzFactor;
        } else {
          targetY = base.y * (1 - cfg.ySquashMax * amt);
          const xzFactor = 1 + cfg.xzStretchMax * amt;
          targetX = base.x * xzFactor;
          targetZ = base.z * xzFactor;
        }
      }

      ref.scale.x += (targetX - ref.scale.x) * cfg.scaleLerp;
      ref.scale.y += (targetY - ref.scale.y) * cfg.scaleLerp;
      ref.scale.z += (targetZ - ref.scale.z) * cfg.scaleLerp;

      // 안전 클램프(드리프트 방지)
      const clamp = (v: number, lo: number, hi: number) =>
        Math.min(hi, Math.max(lo, v));
      ref.scale.x = clamp(ref.scale.x, base.x * 0.7, base.x * 1.3);
      ref.scale.y = clamp(ref.scale.y, base.y * 0.7, base.y * 1.3);
      ref.scale.z = clamp(ref.scale.z, base.z * 0.7, base.z * 1.3);
    }
  });
}

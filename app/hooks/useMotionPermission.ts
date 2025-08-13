import { useCallback, useEffect, useRef, useState } from "react";

export type MotionPermissionRequestResult =
  | { ok: true }
  | { ok: false; reason: string };

export type MotionPermissionState = {
  /** 브라우저가 기울기/모션 이벤트를 지원하는지 */
  isSupported: boolean;
  /** iOS 13+ 스타일의 사용자 권한 요청이 필요한지 추정 */
  needsPermission: boolean;
  /** 현재 권한이 있는지(또는 권한이 불필요한 환경) */
  hasPermission: boolean;
  /** 사용자 제스처 안에서 권한을 요청할 수 있는지 */
  canRequest: boolean;
  /** 사용자 제스처 안에서 호출해야 함 */
  requestPermission: () => Promise<MotionPermissionRequestResult>;
};

/**
 * iOS 13+ 사파리/웹뷰의 모션/오리엔테이션 권한을 요청/관리하는 훅.
 * - 사용자 제스처 안에서 `requestPermission()`을 호출해야 함
 * - 성공 시 `hasPermission`이 true로 전환됨
 */
// 모듈 스코프 전역 상태(싱글톤)
type InternalEnv = {
  isSupported: boolean;
  motionRequestFn?: () => Promise<string>;
  orientationRequestFn?: () => Promise<string>;
};

type InternalState = {
  env: InternalEnv;
  needsPermission: boolean;
  hasPermission: boolean;
  initialized: boolean;
};

const subscribers = new Set<(has: boolean) => void>();
const internal: InternalState = {
  env: { isSupported: false },
  needsPermission: false,
  hasPermission: false,
  initialized: false,
};

function initOnce() {
  if (internal.initialized) return;
  internal.initialized = true;

  if (typeof window === "undefined") {
    internal.env = { isSupported: false };
    internal.needsPermission = false;
    internal.hasPermission = false;
    return;
  }

  const w = window as any;
  const isSupported =
    "ondevicemotion" in window || "ondeviceorientation" in window;

  const motionRequestFn =
    typeof w.DeviceMotionEvent !== "undefined" &&
    typeof w.DeviceMotionEvent.requestPermission === "function"
      ? (w.DeviceMotionEvent.requestPermission as () => Promise<string>)
      : undefined;

  const orientationRequestFn =
    typeof w.DeviceOrientationEvent !== "undefined" &&
    typeof w.DeviceOrientationEvent.requestPermission === "function"
      ? (w.DeviceOrientationEvent.requestPermission as () => Promise<string>)
      : undefined;

  internal.env = { isSupported, motionRequestFn, orientationRequestFn };
  internal.needsPermission = Boolean(motionRequestFn || orientationRequestFn);
  internal.hasPermission = internal.needsPermission ? false : isSupported;
}

function broadcast(has: boolean) {
  for (const fn of subscribers) fn(has);
}

export function useMotionPermission(): MotionPermissionState {
  initOnce();

  const [hasPermission, setHasPermission] = useState<boolean>(
    internal.hasPermission
  );

  // 구독/해제
  const subRef = useRef<((has: boolean) => void) | null>(null);
  useEffect(() => {
    const handler = (has: boolean) => setHasPermission(has);
    subRef.current = handler;
    subscribers.add(handler);
    return () => {
      subscribers.delete(subRef.current!);
      subRef.current = null;
    };
  }, []);

  const needsPermission = internal.needsPermission;
  const canRequest = needsPermission;

  const requestPermission =
    useCallback(async (): Promise<MotionPermissionRequestResult> => {
      try {
        initOnce();
        const env = internal.env;

        if (!internal.needsPermission) {
          internal.hasPermission = env.isSupported;
          broadcast(internal.hasPermission);
          return { ok: true };
        }

        const results: string[] = [];

        if (env.motionRequestFn) {
          try {
            const r = await env.motionRequestFn();
            results.push(r);
          } catch {
            results.push("denied");
          }
        }

        if (env.orientationRequestFn) {
          try {
            const r = await env.orientationRequestFn();
            results.push(r);
          } catch {
            results.push("denied");
          }
        }

        const granted = results.some((r) => r === "granted");
        internal.hasPermission = granted ? true : false;
        broadcast(internal.hasPermission);
        if (granted) return { ok: true };
        return { ok: false, reason: "permission_denied" };
      } catch {
        internal.hasPermission = false;
        broadcast(false);
        return { ok: false, reason: "unexpected_error" };
      }
    }, []);

  return {
    isSupported: internal.env.isSupported,
    needsPermission,
    hasPermission,
    canRequest,
    requestPermission,
  };
}

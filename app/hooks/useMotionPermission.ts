import { useCallback, useEffect, useRef, useState } from "react";
import { LS_KEY } from "~/constants/localStorage";

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
    return;
  }

  const w = window as any;
  const isSupported =
    "ondevicemotion" in window || "ondeviceorientation" in window;

  const motionRequestFn =
    typeof w.DeviceMotionEvent?.requestPermission === "function"
      ? (w.DeviceMotionEvent.requestPermission as () => Promise<string>)
      : undefined;

  const orientationRequestFn =
    typeof w.DeviceOrientationEvent?.requestPermission === "function"
      ? (w.DeviceOrientationEvent.requestPermission as () => Promise<string>)
      : undefined;

  internal.env = { isSupported, motionRequestFn, orientationRequestFn };
  internal.needsPermission = Boolean(motionRequestFn || orientationRequestFn);

  if (internal.needsPermission) {
    // localStorage에 저장된 값이 있으면 초기 권한 상태로 인정
    internal.hasPermission = localStorage.getItem(LS_KEY) === "true";
  } else {
    // 권한 요청이 필요 없는 환경에서는 지원 여부가 곧 권한 상태
    internal.hasPermission = isSupported;
  }
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
  useEffect(() => {
    const handler = (has: boolean) => setHasPermission(has);
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, []);

  const canRequest = internal.needsPermission;

  const requestPermission =
    useCallback(async (): Promise<MotionPermissionRequestResult> => {
      try {
        const env = internal.env;

        if (!internal.needsPermission) {
          // 이 환경에서는 hasPermission이 이미 true로 설정되어 있음
          return { ok: true };
        }

        const results: string[] = [];
        const requestFns = [
          env.motionRequestFn,
          env.orientationRequestFn,
        ].filter(Boolean);

        for (const requestFn of requestFns) {
          try {
            const result = await requestFn!();
            results.push(result);
          } catch {
            results.push("denied");
          }
        }

        const granted = results.some((r) => r === "granted");

        if (granted) {
          internal.hasPermission = true;
          localStorage.setItem(LS_KEY, "true");
          broadcast(true);
          return { ok: true };
        } else {
          internal.hasPermission = false;
          localStorage.removeItem(LS_KEY); // 거부 시 상태 제거
          broadcast(false);
          return { ok: false, reason: "permission_denied" };
        }
      } catch {
        internal.hasPermission = false;
        localStorage.removeItem(LS_KEY); // 에러 발생 시 상태 제거
        broadcast(false);
        return { ok: false, reason: "unexpected_error" };
      }
    }, []);

  return {
    isSupported: internal.env.isSupported,
    needsPermission: internal.needsPermission,
    hasPermission,
    canRequest,
    requestPermission,
  };
}

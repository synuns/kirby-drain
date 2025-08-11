import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type WebGLSupportReason =
  | "NOT_BROWSER"
  | "NO_CANVAS"
  | "NO_WEBGL_API"
  | "CONTEXT_CREATION_FAILED"
  | "UNKNOWN";

export type WebGLSupportStatus = {
  checked: boolean;
  supported: boolean;
  reason?: WebGLSupportReason;
  message?: string;
};

const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  antialias: true,
  depth: true,
  stencil: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: "high-performance",
  failIfMajorPerformanceCaveat: false,
};

function tryCreateContext(canvas: HTMLCanvasElement): boolean {
  try {
    const gl2 = canvas.getContext("webgl2", CONTEXT_ATTRIBUTES as any);
    if (gl2) return true;
  } catch (_) {
    // ignore and try webgl1
  }
  try {
    const gl1 =
      canvas.getContext("webgl", CONTEXT_ATTRIBUTES as any) ||
      canvas.getContext("experimental-webgl", CONTEXT_ATTRIBUTES as any);
    if (gl1) return true;
  } catch (_) {
    // ignore
  }
  return false;
}

export function useWebGLSupport() {
  const [status, setStatus] = useState<WebGLSupportStatus>({
    checked: false,
    supported: false,
  });
  const checkingRef = useRef(false);

  const check = useCallback(() => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      if (typeof window === "undefined") {
        setStatus({ checked: true, supported: false, reason: "NOT_BROWSER" });
        return;
      }
      const canvas = document.createElement("canvas");
      if (!canvas) {
        setStatus({ checked: true, supported: false, reason: "NO_CANVAS" });
        return;
      }

      // Detect if WebGL APIs exist on the window
      const hasApi =
        "WebGL2RenderingContext" in window ||
        "WebGLRenderingContext" in window ||
        "experimental-webgl" in (canvas as any);
      if (!hasApi) {
        setStatus({ checked: true, supported: false, reason: "NO_WEBGL_API" });
        return;
      }

      const ok = tryCreateContext(canvas);
      setStatus({
        checked: true,
        supported: ok,
        reason: ok ? undefined : "CONTEXT_CREATION_FAILED",
      });
    } catch (err) {
      setStatus({
        checked: true,
        supported: false,
        reason: "UNKNOWN",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 지연 체크: 일부 브라우저 확장에 의해 초기 마운트 시 차단되는 경우가 있어 약간 늦게 검사
    const TIMER_DELAY_MS = 0;
    const id = window.setTimeout(check, TIMER_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [check]);

  const result = useMemo(
    () => ({ ...status, recheck: check }),
    [status, check]
  );

  return result as WebGLSupportStatus & { recheck: () => void };
}

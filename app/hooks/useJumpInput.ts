import { useEffect, useRef } from "react";

export function useJumpInput() {
  const pressStartedAt = useRef<number | null>(null);

  useEffect(() => {
    let spaceHeld = false;
    const onDown = () => {
      if (pressStartedAt.current == null)
        pressStartedAt.current = performance.now();
    };
    const onUp = () => {
      // 해제만 기록; 실제 트리거는 외부에서 처리
    };
    const onPointerDown = () => onDown();
    const onPointerUp = () => onUp();
    const onTouchStart = () => onDown();
    const onTouchEnd = () => onUp();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (spaceHeld) return;
      spaceHeld = true;
      onDown();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      spaceHeld = false;
      onUp();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener(
      "touchstart",
      onTouchStart as any,
      { passive: true } as any
    );
    window.addEventListener("touchend", onTouchEnd as any);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("touchstart", onTouchStart as any);
      window.removeEventListener("touchend", onTouchEnd as any);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return { pressStartedAt } as const;
}

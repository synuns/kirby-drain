import { useEffect, useRef } from "react";

type UseJumpControlsParams = {
  onStartPress: () => void;
  onEndPress: () => void;
};

export function useJumpControls({
  onStartPress,
  onEndPress,
}: UseJumpControlsParams) {
  const spaceHeldRef = useRef(false);

  useEffect(() => {
    const onPointerDown = () => onStartPress();
    const onPointerUp = () => onEndPress();
    const onTouchStart = () => onStartPress();
    const onTouchEnd = () => onEndPress();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (spaceHeldRef.current) return;
      spaceHeldRef.current = true;
      onStartPress();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      spaceHeldRef.current = false;
      onEndPress();
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
  }, [onStartPress, onEndPress]);
}

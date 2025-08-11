import { useEffect, useRef, useState } from "react";

export function useMouseFollow() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isIdle, setIsIdle] = useState(false);
  const MOUSE_IDLE_MS = 300;
  const idleTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const resetIdle = () => {
      setIsIdle(false);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(
        () => setIsIdle(true),
        MOUSE_IDLE_MS
      );
    };

    const updateFromClientXY = (clientX: number, clientY: number) => {
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = -(clientY / window.innerHeight) * 2 + 1;
      setMousePosition({ x, y });
      resetIdle();
    };

    const onMouseMove = (event: MouseEvent) => {
      updateFromClientXY(event.clientX, event.clientY);
    };
    const onPointerMove = (event: PointerEvent) => {
      updateFromClientXY(event.clientX, event.clientY);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      const t = event.touches[0];
      updateFromClientXY(t.clientX, t.clientY);
    };
    const onPointerDown = () => resetIdle();
    const onTouchStart = () => resetIdle();

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    resetIdle();
    return () => {
      window.removeEventListener("mousemove", onMouseMove as any);
      window.removeEventListener("pointermove", onPointerMove as any);
      window.removeEventListener("touchmove", onTouchMove as any);
      window.removeEventListener("pointerdown", onPointerDown as any);
      window.removeEventListener("touchstart", onTouchStart as any);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, []);

  // 마우스가 정지 상태일 땐 약화된 반응을 유도하기 위해 값을 축소
  return { x: mousePosition.x, y: mousePosition.y, isIdle };
}

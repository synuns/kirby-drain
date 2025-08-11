import { useEffect, useState } from "react";

export function useMouseFollow() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isIdle, setIsIdle] = useState(false);
  const MOUSE_IDLE_MS = 300;
  let idleTimer: number | undefined;

  useEffect(() => {
    const resetIdle = () => {
      setIsIdle(false);
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setIsIdle(true), MOUSE_IDLE_MS);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      setMousePosition({ x, y });
      resetIdle();
    };

    window.addEventListener("mousemove", handleMouseMove);
    resetIdle();
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (idleTimer) window.clearTimeout(idleTimer);
    };
  }, []);

  // 마우스가 정지 상태일 땐 약화된 반응을 유도하기 위해 값을 축소
  return { x: mousePosition.x, y: mousePosition.y };
}

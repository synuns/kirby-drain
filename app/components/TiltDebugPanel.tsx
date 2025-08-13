import { useEffect, useRef, useState } from "react";
import { useMotionPermission } from "../hooks/useMotionPermission";
import { useDeviceTilt } from "../hooks/useDeviceTilt";
import { useTiltMapping } from "../hooks/useTiltMapping";

export function TiltDebugPanel() {
  const { needsPermission, hasPermission, requestPermission, isSupported } =
    useMotionPermission();
  const tilt = useDeviceTilt();
  const tiltMapped = useTiltMapping();
  const [motionCount, setMotionCount] = useState(0);
  const [orientCount, setOrientCount] = useState(0);
  const last = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isSupported) return;

    const onM = () => {
      setMotionCount((c) => c + 1);
      last.current = "devicemotion";
    };
    const onO = () => {
      setOrientCount((c) => c + 1);
      last.current = "deviceorientation";
    };

    if (hasPermission || !needsPermission) {
      window.addEventListener(
        "devicemotion",
        onM as EventListener,
        { passive: true } as any
      );
      window.addEventListener(
        "deviceorientation",
        onO as EventListener,
        { passive: true } as any
      );
      return () => {
        window.removeEventListener("devicemotion", onM as EventListener);
        window.removeEventListener("deviceorientation", onO as EventListener);
      };
    }
  }, [hasPermission, needsPermission, isSupported]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        left: "calc(env(safe-area-inset-left, 0px) + 12px)",
        background: "#0008",
        color: "#fff",
        padding: 12,
        borderRadius: 8,
        fontSize: 12,
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      <div>supported: {String(isSupported)}</div>
      <div>needsPermission: {String(needsPermission)}</div>
      <div>hasPermission: {String(hasPermission)}</div>
      <div>motion events: {motionCount}</div>
      <div>orientation events: {orientCount}</div>
      <div>last: {last.current || "-"}</div>
      {needsPermission && !hasPermission && (
        <button onClick={() => requestPermission()} style={{ marginTop: 8 }}>
          센서 권한 허용
        </button>
      )}
      <div style={{ marginTop: 8 }}>
        raw tilt: x={tilt.x.toFixed(2)} y={tilt.y.toFixed(2)}
      </div>
      <div>
        mapped tilt: x={tiltMapped.x.toFixed(2)} y={tiltMapped.y.toFixed(2)}
      </div>
    </div>
  );
}

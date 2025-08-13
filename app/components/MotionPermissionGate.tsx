import { type PropsWithChildren } from "react";
import { useMotionPermission } from "../hooks/useMotionPermission";

export function MotionPermissionGate({ children }: PropsWithChildren) {
  const { isSupported, needsPermission, hasPermission, requestPermission } =
    useMotionPermission();

  if (!isSupported) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
        }}
      >
        <div style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Motion sensors are not supported in this environment.
          </div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            Some features may be limited.
          </div>
        </div>
      </div>
    );
  }

  if (needsPermission && !hasPermission) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.6))",
          color: "#fff",
          zIndex: 9998,
          padding: 24,
          WebkitTapHighlightColor: "transparent",
          cursor: "pointer",
        }}
        role="button"
        onClick={() => requestPermission()}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Motion sensor permission is required
          </div>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
            Tap the button to grant access for the best experience.
          </div>
          <button
            onClick={() => requestPermission()}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "#22c55e",
              color: "#00150a",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Allow Motion Access
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

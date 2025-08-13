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
            자이로 센서를 지원하지 않는 환경입니다.
          </div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            일부 기능이 제한될 수 있습니다.
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
            기기의 자이로 센서 권한이 필요합니다
          </div>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
            버튼을 눌러 기기 권한을 허용해 주세요.
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
            센서 권한 허용
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

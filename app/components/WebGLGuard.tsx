import React from "react";
import { useWebGLSupport } from "~/hooks/useWebGLSupport";

type WebGLGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

function DefaultFallback() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          background: "rgba(255,255,255,0.85)",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          color: "#000",
        }}
      >
        <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
          WebGL is disabled
        </h2>
        <p style={{ lineHeight: 1.6, fontSize: 14 }}>
          This page uses WebGL for 3D rendering. Your browser settings, security
          policy, extensions, or disabled hardware acceleration might prevent
          creating a WebGL context.
        </p>
        <ul
          style={{
            marginTop: 12,
            paddingLeft: 18,
            fontSize: 14,
            color: "#000",
            listStyle: "disc",
          }}
        >
          <li>Enable hardware acceleration in your browser and retry</li>
          <li>Disable extensions or try a non-incognito window</li>
          <li>Try another browser (Chrome, Edge, Firefox, Safari)</li>
          <li>Update your GPU drivers</li>
        </ul>
      </div>
    </div>
  );
}

export function WebGLGuard({ children, fallback }: WebGLGuardProps) {
  const { checked, supported } = useWebGLSupport();

  // Render children before the check to reduce SSR/CSR flicker on initial mount
  if (!checked) return <>{children}</>;
  if (!supported) return <>{fallback ?? <DefaultFallback />}</>;
  return <>{children}</>;
}

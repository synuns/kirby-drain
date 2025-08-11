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
          WebGL이 비활성화되어 있어요
        </h2>
        <p style={{ lineHeight: 1.6, fontSize: 14 }}>
          이 페이지는 3D 렌더링을 위해 WebGL을 사용합니다. 브라우저 설정, 보안
          정책, 확장 프로그램 또는 하드웨어 가속 비활성화로 인해 WebGL
          컨텍스트를 만들 수 없습니다.
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
          <li>브라우저 설정에서 하드웨어 가속을 켠 뒤 다시 시도</li>
          <li>시크릿 모드 또는 확장 프로그램을 비활성화하고 새로고침</li>
          <li>다른 브라우저(Chrome, Edge, Firefox, Safari)에서 시도</li>
          <li>GPU 드라이버 업데이트</li>
        </ul>
      </div>
    </div>
  );
}

export function WebGLGuard({ children, fallback }: WebGLGuardProps) {
  const { checked, supported } = useWebGLSupport();

  // 초기 SSR/CSR 전환 시 깜박임을 줄이기 위해 검사 전에는 본문을 먼저 렌더링
  if (!checked) return <>{children}</>;
  if (!supported) return <>{fallback ?? <DefaultFallback />}</>;
  return <>{children}</>;
}

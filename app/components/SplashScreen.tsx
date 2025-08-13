import React, { useEffect, useState } from "react";

const DEFAULT_MINIMUM_DURATION_MS = 1000;

type SplashScreenProps = {
  children: React.ReactNode;
  minimumDurationMs?: number;
  gifSrc?: string;
  background?: string;
};

export function SplashScreen({
  children,
  minimumDurationMs = DEFAULT_MINIMUM_DURATION_MS,
  gifSrc = "/assets/gif/walking-kirby.gif",
  background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
}: SplashScreenProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setIsLoading(false),
      minimumDurationMs
    );
    return () => window.clearTimeout(timeoutId);
  }, [minimumDurationMs]);

  if (isLoading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background,
          zIndex: 9999,
        }}
      >
        <img
          src={gifSrc}
          alt="loading"
          style={{
            width: 128,
            height: 128,
            imageRendering: "pixelated",
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}

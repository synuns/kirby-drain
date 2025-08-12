import { useMemo } from "react";

export type AgentInfo = {
  isMobile: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
};

function detectAgent(): AgentInfo {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isDesktop: true,
      isIOS: false,
      isAndroid: false,
      isSafari: false,
    };
  }

  // Prefer User-Agent Client Hints when available
  const uaDataMobile = (navigator as any).userAgentData?.mobile as
    | boolean
    | undefined;

  const ua = navigator.userAgent || "";
  const platform = (navigator as any).platform || "";

  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports MacIntel with touch points
    (platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);

  const isMobileByUA = /Mobi|Android|iPhone|iPad|iPod|Phone/.test(ua);
  const isMobile = uaDataMobile ?? isMobileByUA;
  const isDesktop = !isMobile;

  // Safari detection (iOS Safari or macOS Safari)
  const isSafari =
    /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua);

  return { isMobile, isDesktop, isIOS, isAndroid, isSafari };
}

export function useAgent(): AgentInfo {
  return useMemo(() => detectAgent(), []);
}

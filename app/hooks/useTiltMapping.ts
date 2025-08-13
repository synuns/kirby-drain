import { useEffect, useMemo, useRef, useState } from "react";
import { useDeviceTilt } from "./useDeviceTilt";

export type TiltMappingOptions = {
  xGain?: number;
  yGain?: number;
  invertX?: boolean;
  invertY?: boolean;
  clamp?: boolean;
  recenterOnMount?: boolean;
  recenterOnPermission?: boolean;
  yExponent?: number;
  yMaxAbs?: number;
  comfortableYUpAbs?: number;
  comfortableYDownAbs?: number;
};

const DEFAULTS: Required<TiltMappingOptions> = {
  xGain: 1.6,
  yGain: 2.5, // 게인 값을 약간 조정하여 더 자연스러운 느낌을 줄 수 있습니다.
  invertX: false,
  invertY: true,
  clamp: true,
  recenterOnMount: true,
  recenterOnPermission: true,
  yExponent: 1.0,
  yMaxAbs: 1.0,
  comfortableYUpAbs: 30, // 이제 각도(degree) 기준
  comfortableYDownAbs: -25, // 이제 각도(degree) 기준
};

// Raw 각도 값을 -1 ~ 1 범위로 정규화
const normalizeAngle = (raw: number, range: number = 50) =>
  Math.max(-1, Math.min(1, raw / range));

export type TiltMapped = {
  x: number;
  y: number;
  hasPermission: boolean;
  recenter: () => void;
  setYComfortAbsolute: (upAbs: number, downAbs: number) => void;
};

export function useTiltMapping(options?: TiltMappingOptions): TiltMapped {
  const cfg = { ...DEFAULTS, ...options };
  const tilt = useDeviceTilt();

  const baseRef = useRef({ x: 0, y: 0 }); // Raw 각도 기준점
  const [mapped, setMapped] = useState({ x: 0, y: 0 });
  const yRangeRef = useRef({ up: 30, down: 25 }); // 기준점 대비 각도 변화량
  const hasValidValues = useRef(false);

  const clamp = (v: number) => (cfg.clamp ? Math.max(-1, Math.min(1, v)) : v);

  const recenter = () => {
    baseRef.current = { x: tilt.x, y: tilt.y };
    hasValidValues.current = true;
  };

  const setYComfortAbsolute = (upAbs: number, downAbs: number) => {
    const baseY = baseRef.current.y;
    // 기준점으로부터의 각도 차이(델타)를 계산
    const upDelta = Math.max(10, Math.abs(upAbs - baseY));
    const downDelta = Math.max(10, Math.abs(downAbs - baseY));
    yRangeRef.current = { up: upDelta, down: downDelta };
  };

  useEffect(() => {
    if (!tilt.hasPermission) {
      hasValidValues.current = false;
      return;
    }
    const isValidSensor = tilt.x !== 0 || tilt.y !== 0;
    if (isValidSensor && !hasValidValues.current) {
      recenter();
      if (
        typeof cfg.comfortableYUpAbs === "number" &&
        typeof cfg.comfortableYDownAbs === "number"
      ) {
        setYComfortAbsolute(cfg.comfortableYUpAbs, cfg.comfortableYDownAbs);
      }
      hasValidValues.current = true;
    }
  }, [tilt.hasPermission, tilt.x, tilt.y]);

  useEffect(() => {
    if (!hasValidValues.current || !tilt.hasPermission) {
      setMapped({ x: 0, y: 0 });
      return;
    }

    const centeredX = tilt.x - baseRef.current.x;
    const centeredY = tilt.y - baseRef.current.y;

    const dirX = cfg.invertX ? -centeredX : centeredX;

    // Y축: 앞/뒤 기울기에 따라 다른 범위를 적용하여 정규화
    // centeredY > 0: 뒤로 기울임(up), centeredY < 0: 앞으로 기울임(down)
    const yMovementRange =
      centeredY >= 0 ? yRangeRef.current.up : yRangeRef.current.down;
    const normalizedY = yMovementRange > 0 ? centeredY / yMovementRange : 0;

    const shapedY =
      Math.sign(normalizedY) * Math.pow(Math.abs(normalizedY), cfg.yExponent);
    const dirY = cfg.invertY ? -shapedY : shapedY;

    // X축 정규화 (50도 범위를 기준으로)
    const normalizedX = normalizeAngle(dirX, 50);

    const scaledX = clamp(normalizedX * cfg.xGain);
    const scaledY = clamp(dirY * cfg.yGain);

    setMapped({ x: scaledX, y: scaledY });
  }, [
    tilt.x,
    tilt.y,
    tilt.hasPermission,
    cfg.invertX,
    cfg.invertY,
    cfg.xGain,
    cfg.yGain,
    cfg.clamp,
    cfg.yExponent,
  ]);

  return useMemo(
    () => ({
      x: mapped.x,
      y: mapped.y,
      hasPermission: tilt.hasPermission,
      recenter,
      setYComfortAbsolute,
    }),
    [mapped.x, mapped.y, tilt.hasPermission]
  );
}

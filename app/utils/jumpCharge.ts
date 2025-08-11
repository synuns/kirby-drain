export function mapChargeToFactor(
  heldMs: number,
  maxChargeMs: number,
  chargeKMs: number,
  minFactor: number,
  maxFactor: number
) {
  const clampedHeld = Math.min(maxChargeMs, Math.max(0, heldMs));
  const denom = Math.log1p(maxChargeMs / chargeKMs);
  const u = denom > 0 ? Math.log1p(clampedHeld / chargeKMs) / denom : 0;
  const clampedU = Math.max(0, Math.min(1, u));
  return minFactor + (maxFactor - minFactor) * clampedU;
}

export function computeChargeProgress(
  pressStartedAt: number | null,
  now: number,
  maxChargeMs: number,
  chargeKMs: number
) {
  if (pressStartedAt == null) return 0;
  const heldMs = Math.min(maxChargeMs, now - pressStartedAt);
  const denom = Math.log1p(maxChargeMs / chargeKMs);
  const u = denom > 0 ? Math.log1p(heldMs / chargeKMs) / denom : 0;
  return Math.max(0, Math.min(1, u));
}

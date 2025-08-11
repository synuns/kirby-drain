export type JumpPhase = "idle" | "up" | "down" | "recover";

export function advancePhase(
  current: JumpPhase,
  now: number,
  start: number,
  upMs: number,
  downMs: number,
  recoverMs: number
): { next: JumpPhase; nextStart: number } | null {
  if (current === "up" && now - start >= upMs) {
    return { next: "down", nextStart: now };
  }
  if (current === "down" && now - start >= downMs) {
    return { next: "recover", nextStart: now };
  }
  if (current === "recover" && now - start >= recoverMs) {
    return { next: "idle", nextStart: start };
  }
  return null;
}

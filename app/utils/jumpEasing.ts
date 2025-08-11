export function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

export function easeInQuad(t: number) {
  return t * t;
}

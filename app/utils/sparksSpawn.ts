import type { SparkParticle } from "~/hooks/useSparksPool";

export function spawnBurst(
  pool: SparkParticle[],
  count: number,
  now: number,
  speed: number
) {
  let spawned = 0;
  const target = count;
  for (let i = 0; i < pool.length && spawned < target; i++) {
    const p = pool[i];
    if (!p.alive) {
      p.alive = true;
      p.born = now;
      const theta = Math.random() * Math.PI * 2;
      const s = speed * (0.8 + Math.random() * 0.4);
      p.vel
        .set(
          Math.cos(theta) * 0.5,
          1 + Math.random() * 0.6,
          Math.sin(theta) * 0.5
        )
        .multiplyScalar(s);
      p.pos.set(0, 0, 0);
      spawned++;
    }
  }
}

export function integrateParticles(
  pool: SparkParticle[],
  positions: Float32Array,
  now: number,
  dt: number,
  lifetimeMs: number,
  gravity: number
) {
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    if (!p.alive) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      continue;
    }
    const age = now - p.born;
    if (age > lifetimeMs) {
      p.alive = false;
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      continue;
    }
    p.vel.y -= gravity * dt;
    p.pos.addScaledVector(p.vel, dt);
    positions[i * 3 + 0] = p.pos.x;
    positions[i * 3 + 1] = p.pos.y;
    positions[i * 3 + 2] = p.pos.z;
  }
}

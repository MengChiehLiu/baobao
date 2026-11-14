// 粒子特效。每個發射器有自己的數量上限，合計 200。
import { PARTICLE_LIMITS } from '../config.js';
import { PALETTE as P } from './palette.js';

const CONFETTI_TINTS = [P.sakura, P.yolk, P.matcha, P.taro, P.chili];

export function createFx(scene) {
  const z = scene.registry.get('zoom') || 1;
  const k = 1 / z;
  const emitters = {
    steam: scene.add.particles(0, 0, 'fx:steam', {
      emitting: false, lifespan: 1400, speedY: { min: -26, max: -16 }, speedX: { min: -6, max: 6 },
      scale: { start: 0.35 * k, end: 0.9 * k }, alpha: { start: 0.55, end: 0 },
      maxParticles: PARTICLE_LIMITS.steam,
    }),
    soup: scene.add.particles(0, 0, 'fx:soup', {
      emitting: false, lifespan: 500, speed: { min: 60, max: 150 }, gravityY: 300,
      scale: { start: 0.9 * k, end: 0.3 * k }, alpha: { start: 1, end: 0.2 },
      maxParticles: PARTICLE_LIMITS.soup,
    }),
    star: scene.add.particles(0, 0, 'fx:star', {
      emitting: false, lifespan: 600, speed: { min: 50, max: 130 }, rotate: { min: 0, max: 360 },
      scale: { start: 0.8 * k, end: 0.1 * k }, alpha: { start: 1, end: 0 },
      maxParticles: PARTICLE_LIMITS.star,
    }),
    heart: scene.add.particles(0, 0, 'fx:heart', {
      emitting: false, lifespan: 1300, speedY: { min: -120, max: -50 }, speedX: { min: -60, max: 60 },
      scale: { start: 1 * k, end: 0.5 * k }, alpha: { start: 1, end: 0 },
      maxParticles: PARTICLE_LIMITS.heart,
    }),
    confetti: scene.add.particles(0, 0, 'fx:confetti', {
      emitting: false, lifespan: 1600, speed: { min: 120, max: 280 }, angle: { min: 200, max: 340 },
      gravityY: 260, rotate: { min: 0, max: 360 }, scale: k,
      tint: CONFETTI_TINTS, maxParticles: PARTICLE_LIMITS.confetti,
    }),
  };
  for (const e of Object.values(emitters)) e.setDepth(50);
  return {
    emitters,
    burst(name, x, y, n) {
      emitters[name].explode(n, x, y);
    },
    puff(x, y) {
      emitters.steam.emitParticleAt(x, y, 1);
    },
  };
}

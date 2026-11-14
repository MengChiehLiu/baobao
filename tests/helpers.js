// 測試用的小型資料與工具。
import { createBattle, step, place, spawnEnemy } from '../src/logic/battle.js';
import { createRng } from '../src/logic/rng.js';
import { STEP } from '../src/config.js';

export const BUNS = [
  { id: 'charsiu', source: 'base', rarity: 'base', cost: 60, cardCooldown: 3, hp: 100,
    effects: [{ type: 'shoot', damage: 20, interval: 1, range: 150 }] },
  { id: 'mantou', source: 'base', rarity: 'base', onPath: true, cost: 50, cardCooldown: 10, hp: 500,
    effects: [{ type: 'block' }] },
  { id: 'thorny', source: 'gacha', rarity: 'common', onPath: true, cost: 50, cardCooldown: 10, hp: 500,
    effects: [{ type: 'block', thorns: 10 }] },
  { id: 'liusha', source: 'gacha', rarity: 'common', cost: 90, cardCooldown: 5, hp: 100,
    effects: [{ type: 'shoot', damage: 1, interval: 1, range: 150, onHit: [{ type: 'puddle', length: 80, duration: 2, slow: 0.5 }] }] },
  { id: 'guabao', source: 'gacha', rarity: 'rare', cost: 130, cardCooldown: 8, hp: 150,
    effects: [{ type: 'clamp', range: 120, duration: 3, dps: 30, interval: 4 }] },
  { id: 'steamer', source: 'gacha', rarity: 'common', cost: 70, cardCooldown: 6, hp: 100,
    effects: [{ type: 'produce', amount: 15, interval: 6 }] },
  { id: 'veggie', source: 'gacha', rarity: 'common', cost: 80, cardCooldown: 8, hp: 100,
    effects: [{ type: 'healShop', amount: 1, interval: 20 }] },
  { id: 'custard', source: 'gacha', rarity: 'rare', cost: 100, cardCooldown: 8, hp: 100,
    effects: [{ type: 'buff', mul: 0.7 }] },
  { id: 'durian', source: 'gacha', rarity: 'super', cost: 160, cardCooldown: 10, hp: 120,
    effects: [{ type: 'repel', range: 140, interval: 6, duration: 1.5, damage: 0 }] },
  { id: 'mochi', source: 'gacha', rarity: 'super', cost: 160, cardCooldown: 10, hp: 120,
    effects: [{ type: 'freeze', range: 150, interval: 6, duration: 2, damage: 0 }] },
  { id: 'boba', source: 'gacha', rarity: 'rare', cost: 140, cardCooldown: 6, hp: 100,
    effects: [{ type: 'shoot', damage: 20, interval: 1.3, range: 160, onHit: [{ type: 'chain', bounces: 2, range: 110, falloff: 0.5 }] }] },
];

export const ENEMIES = [
  { id: 'ant', hp: 40, speed: 40, bite: 10, bounty: 3, leak: 1 },
  { id: 'tank', hp: 1e6, speed: 40, bite: 0, bounty: 0, leak: 1 },
  { id: 'still', hp: 1e6, speed: 0, bite: 0, bounty: 0, leak: 1 },
  { id: 'armored', hp: 1e6, speed: 0, bite: 0, armor: 6, bounty: 0, leak: 1 },
  { id: 'bigant', hp: 10, speed: 0, bite: 0, bounty: 0, leak: 2, split: { into: 'ant', count: 3 } },
  { id: 'pigeon', hp: 1e6, speed: 45, bite: 0, bounty: 0, leak: 1, flying: true },
  { id: 'boss', hp: 1e6, speed: 40, bite: 0, bounty: 0, leak: 5, boss: true },
];

// 一條直路：從右邊 (11,2) 走到左邊 (-1,2)，長度 960
export const STRAIGHT = [[11, 2], [-1, 2]];

export function makeLevel(overrides = {}) {
  return { id: 99, path: STRAIGHT, blocked: [[5, 0]], newBuns: [], gap: 1, waves: [{ ant: 1 }], ...overrides };
}

export function makeBattle(level = makeLevel(), seed = 1, owned) {
  const own = owned || Object.fromEntries(BUNS.map((b) => [b.id, 1]));
  const s = createBattle(level, { buns: BUNS, enemies: ENEMIES }, own, createRng(seed));
  s.steam = 100000;
  return s;
}

export function freezeWaves(state) {
  state.wavePhase = 'frozen';
}

export function addEnemy(state, defId, d) {
  return spawnEnemy(state, defId, d);
}

export function run(state, seconds) {
  const events = [];
  const n = Math.round(seconds / STEP);
  for (let i = 0; i < n; i++) events.push(...step(state, STEP));
  return events;
}

export function runUntil(state, pred, maxSeconds = 300) {
  const events = [];
  const n = Math.round(maxSeconds / STEP);
  for (let i = 0; i < n; i++) {
    const ev = step(state, STEP);
    events.push(...ev);
    if (pred(ev, state)) return events;
  }
  return events;
}

export { place, step, STEP };

import { describe, it, expect } from 'vitest';
import { makeBattle, addEnemy, freezeWaves, run, runUntil, place, STEP } from './helpers.js';
import { effectiveSpeed, damageEnemy, enemiesInRange } from '../src/logic/effects.js';

describe('效果零件', () => {
  it('護甲：每次傷害減少，至少 1', () => {
    const s = makeBattle();
    const e = addEnemy(s, 'armored', 300);
    const hp0 = e.hp;
    damageEnemy(s, e, 20);
    expect(hp0 - e.hp).toBe(14);
    damageEnemy(s, e, 3);
    expect(hp0 - e.hp).toBe(15);
  });

  it('流沙包留下水灘，地面敵人變慢，鴿子不受影響', () => {
    const s = makeBattle();
    freezeWaves(s);
    place(s, 'liusha', 5, 1);
    const still = addEnemy(s, 'still', 480);
    runUntil(s, (ev) => ev.some((e) => e.type === 'zone'), 5);
    const ant = addEnemy(s, 'ant', 480);
    const pigeon = addEnemy(s, 'pigeon', 480);
    expect(effectiveSpeed(ant, s.defs.enemies.ant, s, false)).toBe(20);
    expect(effectiveSpeed(pigeon, s.defs.enemies.pigeon, s, false)).toBe(45);
    expect(still).toBeDefined();
  });

  it('刈包夾住 3 秒：不能動，總傷害約 90，魔王夾不住', () => {
    const s = makeBattle();
    freezeWaves(s);
    place(s, 'guabao', 5, 1);
    const t = addEnemy(s, 'still', 480);
    const boss = addEnemy(s, 'boss', 470);
    boss.d = 470;
    const hp0 = t.hp;
    run(s, STEP * 2);
    expect(t.clampedBy).not.toBeNull();
    expect(boss.clampedBy).toBeNull();
    expect(effectiveSpeed(t, s.defs.enemies.still, s, false)).toBe(0);
    runUntil(s, (ev) => ev.some((e) => e.type === 'release'), 5);
    expect(hp0 - t.hp).toBeCloseTo(90, 0);
  });

  it('小蒸籠每 6 秒產生蒸氣值', () => {
    const s = makeBattle();
    freezeWaves(s);
    s.nextSteamAt = Infinity;
    s.steam = 70;
    place(s, 'steamer', 5, 1);
    expect(s.steam).toBe(0);
    run(s, 6.05);
    expect(s.steam).toBe(15);
  });

  it('菜包慢慢回復愛心，不會超過上限', () => {
    const s = makeBattle();
    freezeWaves(s);
    s.hearts = 8;
    place(s, 'veggie', 5, 1);
    run(s, 20.1);
    expect(s.hearts).toBe(9);
    run(s, 40.1);
    expect(s.hearts).toBe(10);
  });

  it('奶黃包讓旁邊的包子攻擊變快', () => {
    const s = makeBattle();
    const { bun } = place(s, 'charsiu', 5, 1);
    expect(bun.buffMul).toBe(1);
    place(s, 'custard', 6, 0);
    expect(bun.buffMul).toBeCloseTo(0.7);
    const far = place(s, 'steamer', 1, 4).bun;
    expect(far.buffMul).toBe(1);
  });

  it('榴槤包讓敵人往回走', () => {
    const s = makeBattle();
    freezeWaves(s);
    place(s, 'durian', 5, 1);
    const ant = addEnemy(s, 'ant', 470);
    run(s, STEP * 2);
    const d0 = ant.d;
    run(s, 1);
    expect(ant.d).toBeLessThan(d0);
  });

  it('麻糬包讓範圍內的敵人停住', () => {
    const s = makeBattle();
    freezeWaves(s);
    place(s, 'mochi', 5, 1);
    const ant = addEnemy(s, 'ant', 470);
    run(s, STEP * 2);
    const d0 = ant.d;
    run(s, 1);
    expect(ant.d).toBe(d0);
  });

  it('珍奶包的珍珠會彈到其他敵人', () => {
    const s = makeBattle();
    freezeWaves(s);
    place(s, 'boba', 5, 1);
    const a = addEnemy(s, 'still', 480);
    const b = addEnemy(s, 'still', 540);
    const c = addEnemy(s, 'still', 600);
    const ev = runUntil(s, (e) => e.some((x) => x.type === 'hit'), 5);
    expect(ev.filter((e) => e.type === 'chain').length).toBe(2);
    const hurt = [a, b, c].filter((e) => e.hp < 1e6).length;
    expect(hurt).toBe(3);
  });

  it('範圍圓圈碰到敵人身體就打得到（不用碰到中心）', () => {
    const s = makeBattle();
    freezeWaves(s);
    const { bun } = place(s, 'charsiu', 4, 0); // (440, 100)，範圍 150
    const e = addEnemy(s, 'still', 0);
    // 敵人中心離包子 165：中心在範圍外，但身體（半徑 20）有碰到
    e.d = 0; e.x = bun.x + 165; e.y = bun.y;
    expect(enemiesInRange(s, bun, 150)).toContain(e);
    e.x = bun.x + 175;
    expect(enemiesInRange(s, bun, 150)).not.toContain(e);
  });
});


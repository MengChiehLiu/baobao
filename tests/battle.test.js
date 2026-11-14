import { describe, it, expect } from 'vitest';
import {
  makeBattle, makeLevel, addEnemy, freezeWaves, run, runUntil, place, step, STEP, BUNS, ENEMIES,
} from './helpers.js';
import { createBattle, sell, starsFor } from '../src/logic/battle.js';
import { buildPath } from '../src/logic/path.js';
import { createRng } from '../src/logic/rng.js';

describe('path', () => {
  it('轉角的路長度與座標正確', () => {
    const p = buildPath([[11, 1], [6, 1], [6, 3], [-1, 3]]);
    expect(p.length).toBe(400 + 160 + 560);
    expect(p.posAt(400)).toEqual({ x: 80 + 40 + 6 * 80, y: 60 + 40 + 80 });
    expect(p.cells.has('6,2')).toBe(true);
    expect(p.cells.has('11,1')).toBe(false); // 場外
    expect(p.cells.get('6,1')).toBe(400);
  });
});

describe('place', () => {
  it('一般包子要放草地，路障要放路上', () => {
    const s = makeBattle();
    expect(place(s, 'charsiu', 3, 2)).toEqual({ ok: false, reason: 'needGrass' });
    expect(place(s, 'mantou', 3, 1)).toEqual({ ok: false, reason: 'needPath' });
    expect(place(s, 'charsiu', 3, 1).ok).toBe(true);
    expect(place(s, 'mantou', 3, 2).ok).toBe(true);
  });
  it('裝飾格和場外不能放；格子有包子時不能放', () => {
    const s = makeBattle();
    expect(place(s, 'charsiu', 5, 0)).toEqual({ ok: false, reason: 'blockedCell' });
    expect(place(s, 'charsiu', 11, 0)).toEqual({ ok: false, reason: 'blockedCell' });
    place(s, 'charsiu', 3, 1);
    expect(place(s, 'steamer', 3, 1)).toEqual({ ok: false, reason: 'occupied' });
  });
  it('冷卻與蒸氣值', () => {
    const s = makeBattle();
    place(s, 'charsiu', 3, 1);
    expect(place(s, 'charsiu', 4, 1)).toEqual({ ok: false, reason: 'cooldown' });
    s.steam = 10;
    expect(place(s, 'steamer', 4, 1)).toEqual({ ok: false, reason: 'noSteam' });
  });
  it('沒擁有或沒帶上場的包子不能放', () => {
    const s = createBattle(makeLevel(), { buns: BUNS, enemies: ENEMIES }, { charsiu: 1, mantou: 1 }, createRng(1), ['charsiu']);
    expect(place(s, 'mantou', 3, 2)).toEqual({ ok: false, reason: 'notUnlocked' });
    expect(place(s, 'guabao', 3, 1)).toEqual({ ok: false, reason: 'notUnlocked' });
  });
  it('收回包子退一半蒸氣值', () => {
    const s = makeBattle();
    s.steam = 100;
    const { bun } = place(s, 'charsiu', 3, 1);
    expect(s.steam).toBe(40);
    expect(sell(s, bun.id)).toEqual({ ok: true, refund: 30 });
    expect(s.steam).toBe(70);
    expect(s.buns).toHaveLength(0);
  });
  it('收回正在被咬的路障後，敵人繼續前進，遊戲不會卡住', () => {
    const s = makeBattle();
    freezeWaves(s);
    const { bun } = place(s, 'mantou', 5, 2);
    const ant = addEnemy(s, 'ant', 400);
    run(s, 3);
    expect(ant.bitingId).toBe(bun.id);
    const d0 = ant.d;
    sell(s, bun.id);
    expect(() => run(s, 1)).not.toThrow();
    expect(ant.d).toBeGreaterThan(d0 + 20);
  });
});

describe('戰鬥', () => {
  it('叉燒包打倒範圍內的螞蟻，拿到賞金', () => {
    const s = makeBattle();
    freezeWaves(s);
    s.nextSteamAt = Infinity;
    place(s, 'charsiu', 5, 1);
    const ant = addEnemy(s, 'ant', 200);
    const before = s.steam;
    const ev = runUntil(s, (e) => e.some((x) => x.type === 'enemyDied'), 30);
    expect(ev.some((x) => x.type === 'enemyDied' && x.enemyId === ant.id)).toBe(true);
    expect(s.steam).toBe(before + 3);
  });

  it('路障擋住地面敵人並被咬；鴿子直接飛過', () => {
    const s = makeBattle();
    freezeWaves(s);
    const { bun } = place(s, 'mantou', 5, 2); // pathD = 480
    const ant = addEnemy(s, 'ant', 300);
    const pigeon = addEnemy(s, 'pigeon', 300);
    run(s, 6);
    expect(ant.d).toBeLessThan(bun.pathD);
    expect(ant.d).toBeGreaterThan(bun.pathD - 60);
    expect(bun.hp).toBeLessThan(500);
    expect(pigeon.d).toBeGreaterThan(bun.pathD + 50);
  });

  it('有刺的路障會傷害咬它的敵人', () => {
    const s = makeBattle();
    freezeWaves(s);
    place(s, 'thorny', 5, 2);
    const ant = addEnemy(s, 'ant', 400);
    run(s, 3);
    expect(ant.hp).toBeLessThan(40);
  });

  it('走到櫃台扣愛心；魔王扣 5 顆；愛心歸零就輸', () => {
    const s = makeBattle();
    freezeWaves(s);
    addEnemy(s, 'boss', 955);
    const ev = run(s, 0.5);
    expect(ev.find((e) => e.type === 'leak').damage).toBe(5);
    expect(s.hearts).toBe(5);
    for (let i = 0; i < 5; i++) addEnemy(s, 'ant', 955);
    const ev2 = run(s, 0.5);
    expect(ev2.some((e) => e.type === 'lose')).toBe(true);
    expect(step(s, STEP)).toEqual([]);
  });

  it('大螞蟻被打倒後分裂成 3 隻螞蟻', () => {
    const s = makeBattle();
    freezeWaves(s);
    const big = addEnemy(s, 'bigant', 300);
    big.hp = 0;
    run(s, STEP);
    expect(s.enemies.filter((e) => e.defId === 'ant')).toHaveLength(3);
  });

  it('打完所有波次就過關，依愛心給星星', () => {
    const s = makeBattle(makeLevel({ waves: [{ ant: 2 }] }));
    place(s, 'charsiu', 9, 1);
    place(s, 'charsiu', 3, 1);
    const ev = runUntil(s, (e) => e.some((x) => x.type === 'win' || x.type === 'lose'), 120);
    const win = ev.find((e) => e.type === 'win');
    expect(win).toBeDefined();
    expect(win.stars).toBe(3);
    expect(starsFor(10)).toBe(3);
    expect(starsFor(5)).toBe(2);
    expect(starsFor(4)).toBe(1);
  });

  it('魔王在一波的最後出場', () => {
    const s = makeBattle(makeLevel({ waves: [{ boss: 1, ant: 4 }] }));
    run(s, 0.1);
    run(s, 3);
    expect(s.spawnQueue[s.spawnQueue.length - 1]).toBe('boss');
  });

  it('同樣的種子和操作得到完全相同的結果', () => {
    const level = makeLevel({ path: [[11, 1], [6, 1], [6, 3], [-1, 3]], waves: [{ ant: 6 }, { ant: 4, bigant: 2 }] });
    const play = () => {
      const s = makeBattle(level, 42);
      place(s, 'charsiu', 5, 2);
      place(s, 'boba', 7, 2);
      place(s, 'liusha', 3, 2);
      const ev = run(s, 40);
      const { rng, defs, level: _l, path, ...rest } = s;
      return { ev, rest };
    };
    expect(play()).toEqual(play());
  });
});

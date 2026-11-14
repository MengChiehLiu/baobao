import { describe, it, expect } from 'vitest';
import { enterLevel, applyWin, isPlayable } from '../src/logic/progress.js';
import { pull, rollRarity } from '../src/logic/gacha.js';
import { fuse } from '../src/logic/fusion.js';
import { createRng } from '../src/logic/rng.js';
import { load, save, defaultSave } from '../src/save.js';
import { SAVE_KEY, MAX_BUN_LEVEL } from '../src/config.js';

const BUNS = [
  { id: 'charsiu', source: 'base', rarity: 'base' },
  { id: 'a', source: 'gacha', rarity: 'common' },
  { id: 'b', source: 'gacha', rarity: 'rare' },
  { id: 'c', source: 'gacha', rarity: 'super' },
  { id: 'cheeseliusha', source: 'fusion', rarity: 'fusion' },
];
const RECIPES = [{ inputs: ['cheese', 'saltedegg'], result: 'cheeseliusha' }];
const L3 = { id: 3, newBuns: ['xiaolong'], firstClear: { ingredients: {} } };
const L4 = { id: 4, newBuns: [], firstClear: { ingredients: { cheese: 1, saltedegg: 1 } } };

function memoryStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}
const throwingStorage = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };

describe('解鎖與過關', () => {
  it('新存檔只有叉燒包；進入第 3 關解鎖小籠包', () => {
    expect(defaultSave().owned).toEqual({ charsiu: 1 });
    expect(enterLevel(defaultSave(), L3).owned).toEqual({ charsiu: 1, xiaolong: 1 });
  });
  it('第一次過關：星星數 +1 張扭蛋券；再拿更多星星才會再給', () => {
    const r1 = applyWin(defaultSave(), L3, 2);
    expect(r1.firstClear).toBe(true);
    expect(r1.ticketsGained).toBe(3);
    expect(r1.save.stars[3]).toBe(2);
    const r2 = applyWin(r1.save, L3, 2);
    expect(r2.ticketsGained).toBe(0);
    const r3 = applyWin(r1.save, L3, 3);
    expect(r3.ticketsGained).toBe(1);
    expect(r3.save.stars[3]).toBe(3);
  });
  it('第 4 關第一次過關給起司和鹹蛋黃', () => {
    expect(applyWin(defaultSave(), L4, 1).save.ingredients).toEqual({ cheese: 1, saltedegg: 1 });
  });
  it('過了前一關才能玩下一關', () => {
    expect(isPlayable(defaultSave(), 1)).toBe(true);
    expect(isPlayable(defaultSave(), 2)).toBe(false);
    expect(isPlayable({ ...defaultSave(), cleared: [1] }, 2)).toBe(true);
  });
});

describe('扭蛋', () => {
  it('沒有券就不能抽', () => {
    expect(pull(defaultSave(), BUNS, createRng(1))).toEqual({ ok: false, reason: 'noTicket' });
  });
  it('抽到新的、重複的會升級、滿級退券', () => {
    const rng = { next: () => 0, pick: (a) => a[0] }; // 永遠抽到普通的 a
    let s = { ...defaultSave(), tickets: 10 };
    const r1 = pull(s, BUNS, rng);
    expect(r1).toMatchObject({ ok: true, bunId: 'a', result: 'new', level: 1 });
    expect(r1.save.tickets).toBe(9);
    s = r1.save;
    for (let lvl = 2; lvl <= MAX_BUN_LEVEL; lvl++) {
      const r = pull(s, BUNS, rng);
      expect(r).toMatchObject({ result: 'levelUp', level: lvl });
      s = r.save;
    }
    const before = s.tickets;
    const rMax = pull(s, BUNS, rng);
    expect(rMax.result).toBe('maxed');
    expect(rMax.save.tickets).toBe(before);
  });
  it('稀有度依權重分布', () => {
    const rng = createRng(7);
    const n = { common: 0, rare: 0, super: 0 };
    for (let i = 0; i < 2000; i++) n[rollRarity(rng)] += 1;
    expect(n.common / 2000).toBeGreaterThan(0.5);
    expect(n.super / 2000).toBeGreaterThan(0.05);
    expect(n.super / 2000).toBeLessThan(0.16);
  });
  it('不會抽到基本包子或合成包子', () => {
    const rng = createRng(3);
    let s = { ...defaultSave(), tickets: 200 };
    for (let i = 0; i < 100; i++) {
      const r = pull(s, BUNS, rng);
      expect(['a', 'b', 'c']).toContain(r.bunId);
      s = r.save;
    }
  });
});

describe('合成', () => {
  const withIng = { ...defaultSave(), ingredients: { cheese: 1, saltedegg: 1, chili: 1 } };
  it('成功時與順序無關，各扣 1 並解鎖', () => {
    for (const [a, b] of [['cheese', 'saltedegg'], ['saltedegg', 'cheese']]) {
      const r = fuse(withIng, a, b, RECIPES);
      expect(r.ok).toBe(true);
      expect(r.save.ingredients).toEqual({ cheese: 0, saltedegg: 0, chili: 1 });
      expect(r.save.owned.cheeseliusha).toBe(1);
    }
  });
  it('失敗、已擁有、食材不夠', () => {
    expect(fuse(withIng, 'cheese', 'chili', RECIPES)).toEqual({ ok: false, reason: 'failed' });
    expect(fuse({ ...withIng, owned: { cheeseliusha: 1 } }, 'cheese', 'saltedegg', RECIPES)).toEqual({ ok: false, reason: 'owned' });
    expect(fuse(defaultSave(), 'cheese', 'saltedegg', RECIPES)).toEqual({ ok: false, reason: 'notEnough' });
  });
});

describe('存檔', () => {
  it('舊版存檔（unlockedBuns）轉成 owned，並保留進度', () => {
    const st = memoryStorage({ [SAVE_KEY]: JSON.stringify({ cleared: [1, 2], unlockedBuns: ['charsiu', 'mantou'] }) });
    const s = load(st);
    expect(s.cleared).toEqual([1, 2]);
    expect(s.owned).toEqual({ charsiu: 1, mantou: 1 });
    expect(s.tickets).toBe(0);
  });
  it('無法解析或存取出錯時回傳新存檔，save 不丟錯', () => {
    expect(load(memoryStorage({ [SAVE_KEY]: '{oops' }))).toEqual(defaultSave());
    expect(load(throwingStorage)).toEqual(defaultSave());
    expect(() => save(defaultSave(), throwingStorage)).not.toThrow();
  });
  it('存了再讀回來一樣', () => {
    const st = memoryStorage();
    const data = { ...defaultSave(), cleared: [1], owned: { charsiu: 2, a: 1 }, tickets: 3 };
    save(data, st);
    expect(load(st)).toEqual(data);
  });
});

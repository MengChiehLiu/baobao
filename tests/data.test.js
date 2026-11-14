import { describe, it, expect } from 'vitest';
import buns from '../src/data/buns.json';
import enemies from '../src/data/enemies.json';
import levels from '../src/data/levels.json';
import ingredients from '../src/data/ingredients.json';
import recipes from '../src/data/recipes.json';
import strings from '../src/data/strings.json';
import { PALETTE } from '../src/art/palette.js';
import { buildPath } from '../src/logic/path.js';
import { FIELD } from '../src/config.js';

const ids = (list) => list.map((x) => x.id);
const unique = (list) => new Set(list).size === list.length;

const LOOK = {
  body: ['round', 'oval', 'square', 'folded', 'flat', 'tall', 'spiky', 'basket', 'pan'],
  top: ['none', 'twist', 'dot', 'crack'],
  topping: ['none', 'sesame', 'leaf', 'cheese', 'chili', 'seeds', 'pearls', 'scallion', 'bow', 'cream'],
  face: ['smile', 'open', 'sleepy', 'wink', 'cool'],
};
const ENEMY_KINDS = ['ant', 'mouse', 'roach', 'pigeon', 'ladybug', 'snail'];
const EFFECTS = ['shoot', 'splash', 'puddle', 'clamp', 'block', 'oil', 'produce', 'healShop', 'buff', 'repel', 'freeze', 'burst', 'slowHit', 'chain'];

function checkEffects(list) {
  for (const e of list) {
    expect(EFFECTS).toContain(e.type);
    for (const k of ['damage', 'interval', 'range', 'radius', 'duration', 'dps', 'amount', 'length']) {
      if (k in e) expect(e[k]).toBeGreaterThanOrEqual(0);
    }
    if ('slow' in e) { expect(e.slow).toBeGreaterThan(0); expect(e.slow).toBeLessThan(1); }
    if (e.onHit) checkEffects(e.onHit);
    if (e.onRelease) checkEffects(e.onRelease);
  }
}

describe('資料檔', () => {
  it('id 沒有重複', () => {
    for (const list of [buns, enemies, levels, ingredients]) expect(unique(ids(list))).toBe(true);
  });

  it('包子數值、稀有度與外觀', () => {
    expect(buns.length).toBeGreaterThanOrEqual(18);
    for (const b of buns) {
      expect(['base', 'gacha', 'fusion']).toContain(b.source);
      if (b.source === 'gacha') expect(['common', 'rare', 'super']).toContain(b.rarity);
      else expect(b.rarity).toBe(b.source);
      expect(b.cost).toBeGreaterThan(0);
      expect(b.cardCooldown).toBeGreaterThan(0);
      expect(b.hp).toBeGreaterThan(0);
      expect(typeof b.desc).toBe('string');
      checkEffects(b.effects);
      const l = b.look;
      expect(LOOK.body).toContain(l.body);
      expect(LOOK.top).toContain(l.top);
      expect(LOOK.topping).toContain(l.topping);
      expect(LOOK.face).toContain(l.face);
      expect(PALETTE).toHaveProperty(l.color);
      if (l.filling !== null) expect(PALETTE).toHaveProperty(l.filling);
      if (b.source === 'fusion') expect(typeof b.hint).toBe('string');
    }
  });

  it('每種稀有度都有扭蛋包子', () => {
    for (const r of ['common', 'rare', 'super']) {
      expect(buns.some((b) => b.source === 'gacha' && b.rarity === r)).toBe(true);
    }
  });

  it('敵人數值', () => {
    for (const e of enemies) {
      expect(e.hp).toBeGreaterThan(0);
      expect(e.speed).toBeGreaterThan(0);
      expect(e.bite).toBeGreaterThanOrEqual(0);
      expect(e.leak).toBeGreaterThan(0);
      expect(ENEMY_KINDS).toContain(e.look.kind);
      expect(PALETTE).toHaveProperty(e.look.color);
      if (e.split) expect(ids(enemies)).toContain(e.split.into);
    }
  });

  it('關卡：路線是直角轉彎、從右邊進來走到櫃台、不會交叉；裝飾不在路上', () => {
    const enemyIds = ids(enemies);
    for (const l of levels) {
      const pts = l.path;
      expect(pts[0][0]).toBe(FIELD.cols);
      expect(pts[pts.length - 1][0]).toBe(-1);
      for (let i = 0; i < pts.length - 1; i++) {
        const [a, b] = [pts[i], pts[i + 1]];
        expect(a[0] === b[0] || a[1] === b[1]).toBe(true);
      }
      // 不交叉：每個格子只經過一次
      const seen = new Set();
      for (let i = 0; i < pts.length - 1; i++) {
        const [c0, r0] = pts[i];
        const [c1, r1] = pts[i + 1];
        const n = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0));
        for (let k = i === 0 ? 0 : 1; k <= n; k++) {
          const key = `${c0 + Math.sign(c1 - c0) * k},${r0 + Math.sign(r1 - r0) * k}`;
          expect(seen.has(key), `L${l.id} ${key}`).toBe(false);
          seen.add(key);
        }
      }
      const path = buildPath(l.path);
      for (const [c, r] of l.blocked || []) expect(path.cells.has(`${c},${r}`)).toBe(false);
      expect(l.gap).toBeGreaterThan(0);
      for (const w of l.waves) for (const [id, n] of Object.entries(w)) {
        expect(enemyIds).toContain(id);
        expect(n).toBeGreaterThan(0);
      }
    }
  });

  it('每關只解鎖基本包子，基本包子都會在某一關解鎖', () => {
    const base = buns.filter((b) => b.source === 'base').map((b) => b.id);
    const all = levels.flatMap((l) => l.newBuns);
    for (const id of all) expect(base).toContain(id);
    for (const id of base) expect(all.filter((x) => x === id)).toHaveLength(1);
  });

  it('配方引用的 id 都存在', () => {
    const ingIds = ids(ingredients);
    for (const r of recipes) {
      for (const i of r.inputs) expect(ingIds).toContain(i);
      expect(buns.find((b) => b.id === r.result)?.source).toBe('fusion');
    }
  });

  it('每個失敗原因都有說明文字', () => {
    for (const r of ['noSteam', 'cooldown', 'occupied', 'blockedCell', 'needGrass', 'needPath', 'notUnlocked', 'notEnough', 'failed', 'owned', 'noTicket']) {
      expect(typeof strings.reason[r]).toBe('string');
    }
  });
});

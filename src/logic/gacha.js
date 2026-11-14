// 扭蛋：真正隨機，分普通／稀有／超稀有。抽到重複的會升級，滿級時退回 1 張券。
import { GACHA_WEIGHTS, MAX_BUN_LEVEL } from '../config.js';

export function gachaPool(buns) {
  return buns.filter((b) => b.source === 'gacha');
}

export function rollRarity(rng, weights = GACHA_WEIGHTS) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = rng.next() * total;
  for (const [rarity, w] of Object.entries(weights)) {
    if (r < w) return rarity;
    r -= w;
  }
  return 'common';
}

/**
 * 抽一次。回傳 { ok: true, save, bunId, rarity, result: 'new'|'levelUp'|'maxed', level }
 * 或 { ok: false, reason: 'noTicket' }。
 */
export function pull(save, buns, rng) {
  if ((save.tickets || 0) < 1) return { ok: false, reason: 'noTicket' };
  const pool = gachaPool(buns);
  let rarity = rollRarity(rng);
  let candidates = pool.filter((b) => b.rarity === rarity);
  if (!candidates.length) { rarity = 'common'; candidates = pool.filter((b) => b.rarity === 'common'); }
  const bun = rng.pick(candidates);

  const owned = { ...save.owned };
  let tickets = save.tickets - 1;
  let result;
  const cur = owned[bun.id] || 0;
  if (cur === 0) {
    owned[bun.id] = 1;
    result = 'new';
  } else if (cur < MAX_BUN_LEVEL) {
    owned[bun.id] = cur + 1;
    result = 'levelUp';
  } else {
    tickets += 1;
    result = 'maxed';
  }
  return {
    ok: true,
    bunId: bun.id,
    rarity,
    result,
    level: owned[bun.id],
    save: { ...save, owned, tickets, pulls: (save.pulls || 0) + 1 },
  };
}

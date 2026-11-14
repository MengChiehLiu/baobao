// 解鎖與過關獎勵。只回傳新的存檔，不直接寫入。

export function enterLevel(save, level) {
  const owned = { ...save.owned };
  for (const id of level.newBuns) if (!owned[id]) owned[id] = 1;
  return { ...save, owned };
}

/**
 * 過關。星星比以前多時，每多一顆給 1 張扭蛋券；第一次過關再多給 1 張與食材。
 */
export function applyWin(save, level, stars) {
  const prevStars = save.stars?.[level.id] || 0;
  const firstClear = !save.cleared.includes(level.id);
  const newStars = Math.max(0, stars - prevStars);
  const ticketsGained = newStars + (firstClear ? 1 : 0);
  const ingredients = firstClear ? { ...(level.firstClear?.ingredients || {}) } : {};

  const next = {
    ...save,
    cleared: firstClear ? [...save.cleared, level.id] : save.cleared,
    stars: { ...save.stars, [level.id]: Math.max(prevStars, stars) },
    tickets: (save.tickets || 0) + ticketsGained,
    ingredients: { ...save.ingredients },
  };
  for (const [id, n] of Object.entries(ingredients)) next.ingredients[id] = (next.ingredients[id] || 0) + n;
  return { save: next, firstClear, ticketsGained, ingredients, newStars };
}

export function isPlayable(save, id) {
  return id === 1 || save.cleared.includes(id) || save.cleared.includes(id - 1);
}

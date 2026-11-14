// 蒸籠合成。回傳 { ok: true, save, bunId } 或 { ok: false, reason }。

const key = (a, b) => [a, b].sort().join('+');

export function fuse(save, a, b, recipes) {
  const have = save.ingredients || {};
  const need = a === b ? { [a]: 2 } : { [a]: 1, [b]: 1 };
  for (const [id, n] of Object.entries(need)) {
    if ((have[id] || 0) < n) return { ok: false, reason: 'notEnough' };
  }
  const recipe = recipes.find((r) => key(r.inputs[0], r.inputs[1]) === key(a, b));
  if (!recipe) return { ok: false, reason: 'failed' };
  if (save.owned[recipe.result]) return { ok: false, reason: 'owned' };

  const ingredients = { ...have };
  ingredients[a] -= 1;
  ingredients[b] -= 1;
  return {
    ok: true,
    bunId: recipe.result,
    save: { ...save, ingredients, owned: { ...save.owned, [recipe.result]: 1 } },
  };
}

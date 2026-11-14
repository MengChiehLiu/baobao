// 效果零件。不引用 Phaser。
// 敵人位置用「走了多遠」d 表示；畫面座標由 path.posAt(d) 換算。

import { BULLET, CLAMP_IMMUNITY, FREEZE_IMMUNITY, LEVEL_MUL, HEARTS, FIELD, ENEMY_RADIUS } from '../config.js';

export const EPS = 1e-9;
export const reached = (t, target) => t >= target - EPS;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** 一次性傷害：扣掉護甲，至少 1。持續傷害（每步）傳入 dt：護甲按時間比例扣。 */
export function damageEnemy(state, enemy, amount, dt) {
  if (enemy.hp <= 0) return;
  const armor = state.defs.enemies[enemy.defId].armor || 0;
  if (dt !== undefined) enemy.hp -= Math.max(0, amount - armor * dt);
  else enemy.hp -= Math.max(1, amount - armor);
}

/** 敵人身體的半徑：範圍圓圈碰到身體就算打得到。 */
export function bodyRadius(def) {
  if (def.boss) return 36;
  if (def.look?.big) return 26;
  return ENEMY_RADIUS;
}

export function enemiesInRange(state, from, range, pred = () => true) {
  return state.enemies.filter((e) => e.hp > 0
    && dist(e, from) <= range + bodyRadius(state.defs.enemies[e.defId]) && pred(e));
}

/** 目標：first = 走最遠的；strong = 血最多的。 */
export function pickTarget(list, mode = 'first') {
  let best = null;
  for (const e of list) {
    if (!best) { best = e; continue; }
    if (mode === 'strong' ? e.hp > best.hp : e.d > best.d) best = e;
  }
  return best;
}

const mul = (bun) => LEVEL_MUL(bun.lvl);

/** 觸發型零件（onHit／onRelease）。target 是主要目標（可能已死）。 */
export function trigger(params, at, state, emit, bun, target) {
  const m = mul(bun);
  switch (params.type) {
    case 'splash': {
      for (const e of enemiesInRange(state, at, params.radius)) {
        if (target && e.id === target.id) continue;
        damageEnemy(state, e, params.damage * m);
      }
      emit({ type: 'splash', x: at.x, y: at.y, radius: params.radius });
      break;
    }
    case 'puddle': {
      if (!target || state.defs.enemies[target.defId].flying) break;
      addZone(state, emit, { kind: 'puddle', d: target.d, length: params.length, duration: params.duration, slow: params.slow });
      break;
    }
    case 'slowHit': {
      if (target && target.hp > 0) {
        target.slowUntil = state.t + params.duration;
        target.slowMul = Math.min(target.slowMul ?? 1, params.mul);
        emit({ type: 'slowed', enemyId: target.id });
      }
      break;
    }
    case 'chain': {
      if (!target) break;
      let from = target;
      const hit = new Set([target.id]);
      let dmg = params.damage ?? 0;
      dmg = dmg || (params._base || 0);
      for (let i = 0; i < params.bounces; i++) {
        const next = pickNearest(enemiesInRange(state, from, params.range, (e) => !hit.has(e.id)), from);
        if (!next) break;
        dmg *= params.falloff;
        damageEnemy(state, next, dmg);
        emit({ type: 'chain', fromX: from.x, fromY: from.y, toX: next.x, toY: next.y });
        hit.add(next.id);
        from = next;
      }
      break;
    }
    default:
      break;
  }
}

function pickNearest(list, from) {
  let best = null;
  let bd = Infinity;
  for (const e of list) {
    const d = dist(e, from);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

function addZone(state, emit, z) {
  const zone = { id: state.nextId++, endsAt: state.t + z.duration, ...z };
  state.zones.push(zone);
  const p = state.path.posAt(z.d);
  emit({ type: 'zone', id: zone.id, kind: z.kind, x: p.x, y: p.y, d: z.d, length: z.length });
}

/** 攻擊間隔：旁邊有奶黃包時變快。 */
function intervalOf(bun, params) {
  return params.interval * (bun.buffMul || 1);
}

const shoot = {
  update(bun, params, key, state, emit) {
    if (!reached(state.t, bun.timers[key])) return;
    const target = pickTarget(enemiesInRange(state, bun, params.range), params.target);
    if (!target) return;
    const m = mul(bun);
    const onHit = (params.onHit || []).map((h) => (h.type === 'chain' ? { ...h, _base: params.damage * m } : h));
    const b = {
      id: state.nextId++,
      x: bun.x,
      y: bun.y - 10,
      targetId: target.id,
      damage: params.damage * m,
      onHit,
      ownerId: bun.id,
      ownerDefId: bun.defId,
    };
    state.bullets.push(b);
    bun.timers[key] = state.t + intervalOf(bun, params);
    emit({ type: 'shoot', bunId: bun.id, bulletId: b.id });
  },
};

function releaseClamp(bun, params, key, state, emit) {
  const target = state.enemies.find((e) => e.id === bun.clampTargetId);
  const at = target ? { x: target.x, y: target.y } : bun.clampLast;
  if (target) {
    target.clampedBy = null;
    target.noClampUntil = state.t + CLAMP_IMMUNITY;
  }
  bun.clampTargetId = null;
  bun.timers[key] = state.t + intervalOf(bun, params);
  emit({ type: 'release', bunId: bun.id });
  for (const p of params.onRelease || []) trigger(p, at, state, emit, bun, null);
}

const clamp = {
  update(bun, params, key, state, emit, dt) {
    if (bun.clampTargetId !== null) {
      const target = state.enemies.find((e) => e.id === bun.clampTargetId && e.hp > 0);
      if (!target || reached(state.t, bun.clampEndsAt)) {
        releaseClamp(bun, params, key, state, emit);
        return;
      }
      damageEnemy(state, target, params.dps * mul(bun) * dt, dt);
      bun.clampLast = { x: target.x, y: target.y };
      return;
    }
    if (!reached(state.t, bun.timers[key])) return;
    const target = pickTarget(enemiesInRange(state, bun, params.range,
      (e) => e.clampedBy === null && reached(state.t, e.noClampUntil) && !state.defs.enemies[e.defId].boss));
    if (!target) return;
    target.clampedBy = bun.id;
    target.bitingId = null;
    bun.clampTargetId = target.id;
    bun.clampEndsAt = state.t + params.duration;
    bun.clampLast = { x: target.x, y: target.y };
    damageEnemy(state, target, params.dps * mul(bun) * dt, dt);
    emit({ type: 'clamp', bunId: bun.id, enemyId: target.id });
  },
  forceRelease(bun, state) {
    const target = state.enemies.find((e) => e.id === bun.clampTargetId);
    if (target) {
      target.clampedBy = null;
      target.noClampUntil = state.t + CLAMP_IMMUNITY;
    }
    bun.clampTargetId = null;
  },
};

const oil = {
  update(bun, params, key, state, emit) {
    if (!reached(state.t, bun.timers[key])) return;
    const target = pickTarget(enemiesInRange(state, bun, params.range, (e) => !state.defs.enemies[e.defId].flying));
    if (!target) return;
    addZone(state, emit, { kind: 'oil', d: target.d, length: params.length, duration: params.duration, dps: params.dps * mul(bun) });
    bun.timers[key] = state.t + intervalOf(bun, params);
    emit({ type: 'cast', bunId: bun.id });
  },
};

const produce = {
  update(bun, params, key, state, emit) {
    if (!reached(state.t, bun.timers[key])) {
      return;
    }
    if (bun.timers[key] === bun.placedAt) {
      bun.timers[key] = state.t + params.interval;
      return;
    }
    const amount = Math.round(params.amount * mul(bun));
    state.steam += amount;
    bun.timers[key] = state.t + params.interval;
    emit({ type: 'produce', bunId: bun.id, amount, x: bun.x, y: bun.y });
  },
};

const healShop = {
  update(bun, params, key, state, emit) {
    if (bun.timers[key] === bun.placedAt) {
      bun.timers[key] = state.t + params.interval / mul(bun);
      return;
    }
    if (!reached(state.t, bun.timers[key])) return;
    bun.timers[key] = state.t + params.interval / mul(bun);
    if (state.hearts >= HEARTS) return;
    state.hearts = Math.min(HEARTS, state.hearts + params.amount);
    emit({ type: 'heal', bunId: bun.id, x: bun.x, y: bun.y });
  },
};

const repel = {
  update(bun, params, key, state, emit) {
    if (!reached(state.t, bun.timers[key])) return;
    const list = enemiesInRange(state, bun, params.range, (e) => !state.defs.enemies[e.defId].boss);
    if (!list.length) return;
    for (const e of list) {
      e.repelUntil = state.t + params.duration;
      if (params.damage) damageEnemy(state, e, params.damage * mul(bun));
    }
    bun.timers[key] = state.t + intervalOf(bun, params);
    emit({ type: 'repel', bunId: bun.id, x: bun.x, y: bun.y, range: params.range });
  },
};

const freeze = {
  update(bun, params, key, state, emit) {
    if (!reached(state.t, bun.timers[key])) return;
    const list = enemiesInRange(state, bun, params.range, (e) => reached(state.t, e.noFreezeUntil || 0));
    if (!list.length) return;
    const duration = params.duration * (state.defs.enemies[list[0].defId].boss ? 0.5 : 1);
    for (const e of list) {
      const d = state.defs.enemies[e.defId].boss ? params.duration * 0.5 : params.duration;
      e.frozenUntil = state.t + d * Math.min(1.5, mul(bun));
      e.noFreezeUntil = e.frozenUntil + FREEZE_IMMUNITY;
      if (params.damage) damageEnemy(state, e, params.damage * mul(bun));
    }
    bun.timers[key] = state.t + intervalOf(bun, params);
    emit({ type: 'freeze', bunId: bun.id, x: bun.x, y: bun.y, range: params.range, duration });
  },
};

const burst = {
  update(bun, params, key, state, emit) {
    if (bun.timers[key] === bun.placedAt) {
      bun.timers[key] = state.t + intervalOf(bun, params);
      return;
    }
    if (!reached(state.t, bun.timers[key])) return;
    const target = pickTarget(enemiesInRange(state, bun, params.range), 'strong');
    if (!target) return;
    const at = { x: target.x, y: target.y };
    damageEnemy(state, target, params.damage * mul(bun));
    for (const e of enemiesInRange(state, at, params.radius)) {
      if (e.id !== target.id) damageEnemy(state, e, params.damage * 0.4 * mul(bun));
    }
    bun.timers[key] = state.t + intervalOf(bun, params);
    emit({ type: 'burst', bunId: bun.id, x: at.x, y: at.y, radius: params.radius });
  },
};

const passive = { update() {} };

export const COMPONENTS = {
  shoot, clamp, oil, produce, healShop, repel, freeze, burst, block: passive, buff: passive,
};

/** 重新計算每個包子身上的奶黃包加速。 */
export function recomputeBuffs(state) {
  for (const b of state.buns) b.buffMul = 1;
  for (const src of state.buns) {
    const fx = state.defs.buns[src.defId].effects.find((e) => e.type === 'buff');
    if (!fx) continue;
    const m = 1 - (1 - fx.mul) * LEVEL_MUL(src.lvl);
    for (const b of state.buns) {
      if (b === src) continue;
      if (Math.abs(b.col - src.col) <= 1 && Math.abs(b.row - src.row) <= 1) {
        b.buffMul = Math.min(b.buffMul, Math.max(0.4, m));
      }
    }
  }
}

/** 子彈追著目標飛。 */
export function updateBullets(state, dt, emit) {
  const keep = [];
  for (const b of state.bullets) {
    const target = state.enemies.find((e) => e.id === b.targetId && e.hp > 0);
    if (!target) { emit({ type: 'bulletGone', bulletId: b.id }); continue; }
    const dx = target.x - b.x;
    const dy = target.y - b.y;
    const len = Math.hypot(dx, dy);
    const stepLen = BULLET.speed * dt;
    if (len <= BULLET.hitRange + stepLen) {
      const bun = { lvl: 1, ...state.buns.find((x) => x.id === b.ownerId) };
      damageEnemy(state, target, b.damage);
      emit({ type: 'hit', bulletId: b.id, enemyId: target.id, x: target.x, y: target.y, ownerDefId: b.ownerDefId });
      for (const p of b.onHit) trigger(p, { x: target.x, y: target.y }, state, emit, bun, target);
      continue;
    }
    b.x += (dx / len) * stepLen;
    b.y += (dy / len) * stepLen;
    keep.push(b);
  }
  state.bullets = keep;
}

/** 敵人目前的速度（可以是負的：被榴槤嚇得往回走）。 */
export function effectiveSpeed(enemy, def, state, blocked) {
  if (enemy.clampedBy !== null) return 0;
  if (enemy.frozenUntil && !reached(state.t, enemy.frozenUntil)) return 0;
  if (enemy.repelUntil && !reached(state.t, enemy.repelUntil)) return -def.speed * 0.8;
  if (blocked) return 0;
  let m = 1;
  if (enemy.slowUntil && !reached(state.t, enemy.slowUntil)) m = Math.min(m, enemy.slowMul ?? 1);
  if (!def.flying) {
    for (const z of state.zones) {
      if (z.kind === 'puddle' && Math.abs(enemy.d - z.d) <= z.length / 2) m = Math.min(m, z.slow);
    }
  }
  return def.speed * m;
}

export const CELL = FIELD.cell;

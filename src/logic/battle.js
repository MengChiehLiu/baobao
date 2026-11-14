// 戰鬥規則（彎路塔防）。不引用 Phaser；每一步回傳這一步發生的事件。

import {
  STEAM, ENEMY, WAVE, FIELD, HEARTS, SELL_REFUND, LEVEL_MUL, cellCenter,
} from '../config.js';
import { buildPath, isPathCell } from './path.js';
import {
  COMPONENTS, reached, effectiveSpeed, damageEnemy, updateBullets, recomputeBuffs,
} from './effects.js';

const toMap = (list) => (Array.isArray(list) ? Object.fromEntries(list.map((d) => [d.id, d])) : list);

/**
 * @param {Object} level                      levels.json 的一筆
 * @param {{buns, enemies}} defs
 * @param {Object<string, number>} owned       包子 id → 等級（1–3）
 * @param {{next, pick, shuffle}} rng
 * @param {string[]} [loadout]                 帶上場的包子；省略時帶全部
 */
export function createBattle(level, defs, owned, rng, loadout) {
  const ownedMap = Array.isArray(owned) ? Object.fromEntries(owned.map((id) => [id, 1])) : { ...owned };
  return {
    t: 0,
    steam: level.startSteam ?? STEAM.start,
    nextSteamAt: STEAM.tick,
    hearts: HEARTS,
    waveIndex: -1,
    wavePhase: 'waiting',
    phaseEndsAt: WAVE.firstPreviewAt,
    spawnQueue: [],
    nextSpawnAt: 0,
    buns: [],
    enemies: [],
    bullets: [],
    zones: [],
    cardReadyAt: {},
    result: null,
    nextId: 1,
    level,
    path: buildPath(level.path),
    owned: ownedMap,
    loadout: loadout || Object.keys(ownedMap),
    defs: { buns: toMap(defs.buns), enemies: toMap(defs.enemies) },
    rng,
  };
}

export function cellKind(state, col, row) {
  if (col < 0 || col >= FIELD.cols || row < 0 || row >= FIELD.rows) return 'out';
  if (isPathCell(state.path, col, row)) return 'path';
  if ((state.level.blocked || []).some(([c, r]) => c === col && r === row)) return 'blocked';
  return 'grass';
}

/** 放置包子。回傳 { ok: true, bun } 或 { ok: false, reason }。 */
export function place(state, bunId, col, row) {
  const def = state.defs.buns[bunId];
  if (!def || !state.owned[bunId] || !state.loadout.includes(bunId)) return { ok: false, reason: 'notUnlocked' };
  const kind = cellKind(state, col, row);
  if (kind === 'out' || kind === 'blocked') return { ok: false, reason: 'blockedCell' };
  if (def.onPath && kind !== 'path') return { ok: false, reason: 'needPath' };
  if (!def.onPath && kind !== 'grass') return { ok: false, reason: 'needGrass' };
  if (state.buns.some((b) => b.col === col && b.row === row)) return { ok: false, reason: 'occupied' };
  if (state.cardReadyAt[bunId] !== undefined && !reached(state.t, state.cardReadyAt[bunId])) {
    return { ok: false, reason: 'cooldown' };
  }
  if (state.steam < def.cost) return { ok: false, reason: 'noSteam' };

  state.steam -= def.cost;
  state.cardReadyAt[bunId] = state.t + def.cardCooldown;
  const lvl = state.owned[bunId] || 1;
  const timers = {};
  def.effects.forEach((_, i) => { timers[i] = state.t; });
  const { x, y } = cellCenter(col, row);
  const maxHp = def.hp * (def.onPath ? LEVEL_MUL(lvl) : 1);
  const bun = {
    id: state.nextId++,
    defId: bunId,
    col,
    row,
    x,
    y,
    lvl,
    hp: maxHp,
    maxHp,
    onPath: Boolean(def.onPath),
    pathD: def.onPath ? state.path.cells.get(`${col},${row}`) : null,
    timers,
    placedAt: state.t,
    clampTargetId: null,
    clampEndsAt: 0,
    clampLast: { x, y },
    buffMul: 1,
  };
  state.buns.push(bun);
  recomputeBuffs(state);
  return { ok: true, bun };
}

/** 收回包子，退一半蒸氣值。 */
export function sell(state, bunId) {
  const i = state.buns.findIndex((b) => b.id === bunId);
  if (i < 0) return { ok: false, reason: 'notFound' };
  const bun = state.buns[i];
  if (bun.clampTargetId !== null) COMPONENTS.clamp.forceRelease(bun, state);
  const refund = Math.floor(state.defs.buns[bun.defId].cost * SELL_REFUND);
  state.steam += refund;
  state.buns.splice(i, 1);
  recomputeBuffs(state);
  return { ok: true, refund };
}

function startPreview(state, index, emit) {
  state.waveIndex = index;
  state.wavePhase = 'preview';
  state.phaseEndsAt = state.t + WAVE.previewDuration;
  const counts = { ...state.level.waves[index] };
  const bosses = [];
  const queue = [];
  for (const [id, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i++) (state.defs.enemies[id].boss ? bosses : queue).push(id);
  }
  // 魔王最後出場
  state.spawnQueue = [...state.rng.shuffle(queue), ...bosses];
  emit({ type: 'waveStart', index, total: state.level.waves.length, counts });
}

export function spawnEnemy(state, defId, d = 0, emit = () => {}) {
  const def = state.defs.enemies[defId];
  const p = state.path.posAt(d);
  const hp = Math.round(def.hp * (state.level.hpScale || 1));
  const e = {
    id: state.nextId++,
    defId,
    d,
    x: p.x,
    y: p.y,
    hp,
    maxHp: hp,
    clampedBy: null,
    noClampUntil: 0,
    frozenUntil: 0,
    noFreezeUntil: 0,
    repelUntil: 0,
    slowUntil: 0,
    slowMul: 1,
    bitingId: null,
  };
  state.enemies.push(e);
  emit({ type: 'spawn', enemyId: e.id, defId, boss: Boolean(def.boss) });
  return e;
}

function updateWaves(state, emit) {
  if (state.wavePhase === 'waiting' && reached(state.t, state.phaseEndsAt)) startPreview(state, 0, emit);
  if (state.wavePhase === 'preview' && reached(state.t, state.phaseEndsAt)) {
    state.wavePhase = 'spawning';
    state.nextSpawnAt = state.t;
  }
  if (state.wavePhase === 'spawning') {
    if (state.spawnQueue.length && reached(state.t, state.nextSpawnAt)) {
      const id = state.spawnQueue.shift();
      spawnEnemy(state, id, 0, emit);
      // 魔王出場前多等一下
      const next = state.spawnQueue[0];
      const extra = next && state.defs.enemies[next].boss ? 3 : 0;
      state.nextSpawnAt += state.level.gap + extra;
    }
    if (!state.spawnQueue.length) state.wavePhase = 'clearing';
  } else if (state.wavePhase === 'clearing' && state.enemies.length === 0) {
    if (state.waveIndex + 1 < state.level.waves.length) startPreview(state, state.waveIndex + 1, emit);
    else state.wavePhase = 'done';
  }
}

function blockingBun(state, e) {
  let best = null;
  for (const b of state.buns) {
    if (!b.onPath || b.hp <= 0) continue;
    // 敵人前端碰到路障（路障在前方 40 像素以內）
    if (e.d + ENEMY.halfLength >= b.pathD - 30 && e.d < b.pathD + 10) {
      if (!best || b.pathD < best.pathD) best = b;
    }
  }
  return best;
}

function updateEnemies(state, dt, emit) {
  for (const e of state.enemies) {
    if (e.hp <= 0) continue;
    const def = state.defs.enemies[e.defId];
    const frozen = e.clampedBy !== null || (e.frozenUntil && !reached(state.t, e.frozenUntil));
    let blocker = null;
    if (!def.flying && !frozen) blocker = blockingBun(state, e);
    if (blocker && !(e.repelUntil && !reached(state.t, e.repelUntil))) {
      if (def.bite > 0) blocker.hp -= def.bite * dt;
      const thorns = state.defs.buns[blocker.defId].effects.find((x) => x.type === 'block')?.thorns;
      if (thorns) damageEnemy(state, e, thorns * LEVEL_MUL(blocker.lvl) * dt, dt);
      if (e.bitingId !== blocker.id) emit({ type: 'bite', enemyId: e.id, bunId: blocker.id });
      e.bitingId = blocker.id;
    } else {
      e.bitingId = null;
    }
    const v = effectiveSpeed(e, def, state, Boolean(blocker));
    e.d = Math.max(0, e.d + v * dt);
    const p = state.path.posAt(e.d);
    e.x = p.x;
    e.y = p.y;
  }
}

function removeDead(state, emit) {
  const aliveBuns = [];
  let bunsChanged = false;
  for (const b of state.buns) {
    if (b.hp > 0) { aliveBuns.push(b); continue; }
    if (b.clampTargetId !== null) COMPONENTS.clamp.forceRelease(b, state);
    bunsChanged = true;
    emit({ type: 'bunDied', bunId: b.id });
  }
  state.buns = aliveBuns;
  if (bunsChanged) recomputeBuffs(state);

  const alive = [];
  const spawned = [];
  for (const e of state.enemies) {
    const def = state.defs.enemies[e.defId];
    if (e.hp <= 0) {
      state.steam += def.bounty || 0;
      emit({ type: 'enemyDied', enemyId: e.id, defId: e.defId, x: e.x, y: e.y, bounty: def.bounty || 0 });
      if (def.split) {
        for (let i = 0; i < def.split.count; i++) {
          spawned.push([def.split.into, Math.max(0, e.d - 12 + i * 12)]);
        }
      }
      continue;
    }
    if (e.d >= state.path.length) {
      state.hearts = Math.max(0, state.hearts - (def.leak || 1));
      emit({ type: 'leak', enemyId: e.id, defId: e.defId, damage: def.leak || 1 });
      continue;
    }
    alive.push(e);
  }
  state.enemies = alive;
  for (const [id, d] of spawned) spawnEnemy(state, id, d, emit);
}

/** 推進一步，回傳這一步的事件陣列。分出輸贏後回傳空陣列。 */
export function step(state, dt) {
  if (state.result) return [];
  const events = [];
  const emit = (ev) => events.push(ev);
  state.t += dt;

  while (reached(state.t, state.nextSteamAt)) {
    state.steam += STEAM.perTick;
    state.nextSteamAt += STEAM.tick;
  }
  updateWaves(state, emit);
  for (const bun of state.buns) {
    const def = state.defs.buns[bun.defId];
    def.effects.forEach((params, i) => {
      const comp = COMPONENTS[params.type];
      if (comp) comp.update(bun, params, i, state, emit, dt);
    });
  }
  updateBullets(state, dt, emit);
  state.zones = state.zones.filter((z) => {
    if (reached(state.t, z.endsAt)) { emit({ type: 'zoneGone', id: z.id }); return false; }
    if (z.kind === 'oil') {
      for (const e of state.enemies) {
        if (state.defs.enemies[e.defId].flying) continue;
        if (Math.abs(e.d - z.d) <= z.length / 2) damageEnemy(state, e, z.dps * dt, dt);
      }
    }
    return true;
  });
  updateEnemies(state, dt, emit);
  removeDead(state, emit);

  if (state.hearts <= 0) {
    state.result = 'lose';
    emit({ type: 'lose' });
  } else if ((state.wavePhase === 'clearing' || state.wavePhase === 'done')
    && state.enemies.length === 0 && state.spawnQueue.length === 0
    && state.waveIndex + 1 >= state.level.waves.length) {
    state.wavePhase = 'done';
    state.result = 'win';
    emit({ type: 'win', stars: starsFor(state.hearts) });
  }
  return events;
}

export function starsFor(hearts) {
  if (hearts >= HEARTS) return 3;
  if (hearts >= HEARTS / 2) return 2;
  return 1;
}

import Phaser from 'phaser';
import { setupCamera, text, button, str, getSave, bunTile } from './common.js';
import { makeSprite, makeMap } from '../art/textures.js';
import { popIn, idleBreath, startBlink, windUp, hurt, poof } from '../art/anims.js';
import { createFx } from '../art/particles.js';
import { createBattle, place, step, sell, cellKind } from '../logic/battle.js';
import { createRng } from '../logic/rng.js';
import {
  STEP, MAX_STEPS_PER_FRAME, FIELD, CARD, HEARTS, SELL_REFUND, cellCenter,
} from '../config.js';
import { PALETTE as P, css } from '../art/palette.js';
import buns from '../data/buns.json';
import enemies from '../data/enemies.json';
import levels from '../data/levels.json';

const BUN_Y = -6;
const FLY_Y = -18;
const bunDef = Object.fromEntries(buns.map((b) => [b.id, b]));
const enemyDef = Object.fromEntries(enemies.map((e) => [e.id, e]));

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  init(data) {
    this.levelId = data.levelId;
    this.loadoutIds = data.loadout;
  }

  create() {
    setupCamera(this);
    this.level = levels.find((l) => l.id === this.levelId);
    const save = getSave(this);
    const owned = save.owned;
    let loadout = (this.loadoutIds || save.loadout || []).filter((id) => owned[id]);
    if (!loadout.length) loadout = buns.filter((b) => owned[b.id]).slice(0, 8).map((b) => b.id);
    this.loadout = loadout;
    this.state = createBattle(this.level, { buns, enemies }, owned, createRng(Date.now() >>> 0), loadout);
    this.acc = 0;
    this.paused = false;
    this.ended = false;
    this.selected = null;
    this.info = null;
    this.views = { buns: new Map(), enemies: new Map(), bullets: new Map(), zones: new Map() };

    makeSprite(this, 480, 270, makeMap(this, this.level, this.state.path)).setDepth(-10);
    this.highlight = this.add.graphics().setDepth(1);
    this.overlay = this.add.graphics().setDepth(35);
    this.hpBars = this.add.graphics().setDepth(40);
    this.fx = createFx(this);

    this.createHud();
    this.createCards();
    this.createFieldInput();

    this.time.addEvent({
      delay: 500, loop: true, callback: () => {
        if (this.paused || !this.state.buns.length) return;
        const b = Phaser.Utils.Array.GetRandom(this.state.buns);
        this.fx.puff(b.x + Phaser.Math.Between(-12, 12), b.y - 36);
      },
    });

    const dev = this.registry.get('dev') || {};
    if (dev.fps) this.fpsText = text(this, 940, 80, '', 16, { originX: 1 }).setDepth(100);
  }

  // ---------- 介面 ----------

  createHud() {
    const deco = { stroke: css('cream'), strokeThickness: 6 };
    this.levelText = text(this, 16, 28, str('level', { n: this.level.id }), 22, { originX: 0, ...deco }).setDepth(60);
    makeSprite(this, 140, 28, 'ui:steam').setDepth(60);
    this.steamText = text(this, 164, 28, '', 28, { originX: 0, ...deco }).setDepth(60);
    makeSprite(this, 280, 28, 'ui:heart').setDepth(60);
    this.heartText = text(this, 300, 28, '', 28, { originX: 0, ...deco }).setDepth(60);
    this.waveText = text(this, 560, 28, '', 26, deco).setDepth(60);
    const pauseBtn = button(this, 912, 30, '', () => this.pauseGame(), { key: 'ui:btnRound' }).setDepth(60);
    pauseBtn.setScale(0.75);
    pauseBtn.baseScale = 0.75;
    pauseBtn.add(text(this, 0, -3, 'II', 26));
  }

  createCards() {
    const owned = getSave(this).owned;
    this.cards = this.loadout.map((id, i) => {
      const def = bunDef[id];
      const x = 12 + CARD.w / 2 + i * (CARD.w + CARD.gap);
      const y = CARD.y + CARD.h / 2;
      const c = bunTile(this, x, y, def, { lvl: owned[id], cost: true, h: CARD.h });
      c.setDepth(55);
      const cd = this.add.rectangle(0, CARD.h / 2 - 2, CARD.w - 6, CARD.h - 4, P.outline, 0.45).setOrigin(0.5, 1);
      cd.setScale(1, 0);
      c.add(cd);
      c.cd = cd;
      c.def = def;
      c.setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => this.selectCard(def.id));
      return c;
    });
    this.reasonText = text(this, 480, 440, '', 22, { stroke: css('cream'), strokeThickness: 6 }).setDepth(70).setAlpha(0);
    this.hintText = text(this, 948, CARD.y + CARD.h / 2, '', 16, { originX: 1, wrap: 200, align: 'right' }).setDepth(56);
  }

  createFieldInput() {
    const w = FIELD.cols * FIELD.cell;
    const h = FIELD.rows * FIELD.cell;
    const zone = this.add.zone(FIELD.left + w / 2, FIELD.top + h / 2, w, h).setInteractive();
    zone.on('pointerdown', (p) => {
      if (this.paused || this.ended) return;
      const col = Math.floor((p.worldX - FIELD.left) / FIELD.cell);
      const row = Math.floor((p.worldY - FIELD.top) / FIELD.cell);
      if (this.selected) {
        const res = place(this.state, this.selected, col, row);
        if (res.ok) {
          this.addBunView(res.bun, true);
          this.flashRange(res.bun);
          this.selectCard(null);
        } else {
          this.showReason(res.reason);
        }
        return;
      }
      const bun = this.state.buns.find((b) => b.col === col && b.row === row);
      if (bun) this.showInfo(bun); else this.hideInfo();
    });
  }

  rangeOf(defId) {
    const fx = bunDef[defId].effects.find((e) => e.range);
    return fx ? fx.range : 0;
  }

  flashRange(bun) {
    const r = this.rangeOf(bun.defId);
    if (!r) return;
    const g = this.add.graphics().setDepth(34);
    g.lineStyle(3, P.outline, 0.5);
    g.fillStyle(P.cream, 0.25);
    g.fillCircle(bun.x, bun.y, r);
    g.strokeCircle(bun.x, bun.y, r);
    this.tweens.add({ targets: g, alpha: 0, delay: 600, duration: 400, onComplete: () => g.destroy() });
  }

  showInfo(bun) {
    this.hideInfo();
    const def = bunDef[bun.defId];
    const g = this.add.graphics().setDepth(34);
    const r = this.rangeOf(bun.defId);
    if (r) {
      g.lineStyle(3, P.outline, 0.6);
      g.fillStyle(P.cream, 0.3);
      g.fillCircle(bun.x, bun.y, r);
      g.strokeCircle(bun.x, bun.y, r);
    }
    const refund = Math.floor(def.cost * SELL_REFUND);
    const bx = Phaser.Math.Clamp(bun.x, 150, 860);
    const by = bun.y < 200 ? bun.y + 70 : bun.y - 70;
    const btn = button(this, bx, by, str('sell', { n: refund }), () => {
      const res = sell(this.state, bun.id);
      if (res.ok) {
        const v = this.views.buns.get(bun.id);
        if (v) {
          if (v.chomp) v.chomp.remove();
          this.removeBunView(bun.id);
          poof(this, v.sprite, this.fx);
        }
      }
      this.hideInfo();
    }, { key: 'ui:btnSmall', fontSize: 22 }).setDepth(80);
    this.hintText.setText(`${def.name}  Lv${bun.lvl}\n${def.desc}`);
    this.info = [g, btn];
  }

  hideInfo() {
    for (const o of this.info || []) o.destroy();
    this.info = null;
    if (!this.selected) this.hintText.setText('');
  }

  selectCard(id) {
    if (this.paused || this.ended) return;
    this.hideInfo();
    if (id && this.selected === id) id = null;
    if (id) {
      const def = bunDef[id];
      const readyAt = this.state.cardReadyAt[id];
      if (readyAt !== undefined && this.state.t < readyAt - 1e-9) { this.showReason('cooldown', id); return; }
      if (this.state.steam < def.cost) { this.showReason('noSteam', id); return; }
      this.hintText.setText(`${def.name}\n${def.desc}`);
    } else {
      this.hintText.setText('');
    }
    this.selected = id;
    for (const c of this.cards) c.frame.setTexture(c.def.id === id ? 'ui:cardSel' : `ui:card:${c.def.rarity}`);
    this.drawHighlight();
  }

  drawHighlight() {
    const g = this.highlight;
    g.clear();
    if (!this.selected) return;
    const wantPath = Boolean(bunDef[this.selected].onPath);
    g.fillStyle(wantPath ? P.yolk : P.sakura, 0.45);
    for (let c = 0; c < FIELD.cols; c++) {
      for (let r = 0; r < FIELD.rows; r++) {
        const kind = cellKind(this.state, c, r);
        if (kind !== (wantPath ? 'path' : 'grass')) continue;
        if (this.state.buns.some((b) => b.col === c && b.row === r)) continue;
        g.fillRoundedRect(FIELD.left + c * FIELD.cell + 6, FIELD.top + r * FIELD.cell + 6, FIELD.cell - 12, FIELD.cell - 12, 14);
      }
    }
  }

  showReason(reason, cardId) {
    this.reasonText.setText(str(`reason.${reason}`)).setAlpha(1);
    this.tweens.killTweensOf(this.reasonText);
    this.tweens.add({ targets: this.reasonText, alpha: 0, delay: 900, duration: 400 });
    const card = this.cards.find((c) => c.def.id === (cardId || this.selected));
    if (card) {
      const x0 = card.x;
      this.tweens.add({ targets: card, x: x0 + 5, duration: 45, yoyo: true, repeat: 2, onComplete: () => { card.x = x0; } });
    }
  }

  // ---------- 暫停 ----------

  pauseGame() {
    if (this.paused || this.ended) return;
    this.paused = true;
    this.tweens.pauseAll();
    const shade = this.add.rectangle(480, 270, 960, 540, P.outline, 0.35).setDepth(90).setInteractive();
    const panel = makeSprite(this, 480, 270, 'ui:panel').setDepth(91);
    const title = text(this, 480, 170, str('pause'), 40).setDepth(92);
    const resume = button(this, 480, 260, str('resume'), () => this.resumeGame()).setDepth(92);
    const quit = button(this, 480, 360, str('toSelect'), () => this.scene.start('LevelSelectScene'), { key: 'ui:btnAlt' }).setDepth(92);
    this.pauseUi = [shade, panel, title, resume, quit];
  }

  resumeGame() {
    if (window.matchMedia('(orientation: portrait)').matches) return;
    for (const o of this.pauseUi || []) o.destroy();
    this.pauseUi = null;
    this.paused = false;
    this.tweens.resumeAll();
  }

  // ---------- 主迴圈 ----------

  update(time, delta) {
    if (this.fpsText) this.fpsText.setText(`${this.game.loop.actualFps.toFixed(0)} fps`);
    if (this.paused || this.ended) return;
    this.acc += Math.min(delta, 250) / 1000;
    const events = [];
    let steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS_PER_FRAME) {
      events.push(...step(this.state, STEP));
      this.acc -= STEP;
      steps += 1;
    }
    if (steps === MAX_STEPS_PER_FRAME && this.acc >= STEP) this.acc = 0;
    for (const ev of events) this.handleEvent(ev);
    this.sync();
    this.updateHud();
  }

  floatText(x, y, s, color) {
    const t = text(this, x, y, s, 20, { stroke: css('cream'), strokeThickness: 5, color }).setDepth(45);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  ring(x, y, radius, tint, duration = 320) {
    const ring = makeSprite(this, x, y, 'fx:ring').setDepth(30);
    if (tint) ring.setTint(tint);
    const end = ((radius * 2) / 100) * ring.baseScale;
    ring.setScale(0.1 * ring.baseScale);
    this.tweens.add({ targets: ring, scale: end, alpha: 0, duration, onComplete: () => ring.destroy() });
  }

  handleEvent(ev) {
    switch (ev.type) {
      case 'waveStart': this.showWavePreview(ev); break;
      case 'shoot': case 'cast': {
        const v = this.views.buns.get(ev.bunId);
        if (v) windUp(this, v.sprite);
        break;
      }
      case 'hit': {
        const v = this.views.enemies.get(ev.enemyId);
        if (v) hurt(this, v);
        this.fx.burst('soup', ev.x, ev.y - 6, 3);
        break;
      }
      case 'splash': this.ring(ev.x, ev.y, ev.radius); this.fx.burst('soup', ev.x, ev.y, 7); break;
      case 'chain': {
        const g = this.add.graphics().setDepth(32);
        g.lineStyle(4, P.outline, 0.8);
        g.lineBetween(ev.fromX, ev.fromY, ev.toX, ev.toY);
        this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
        break;
      }
      case 'clamp': {
        // 撲過去咬住，直到放開才回來
        const v = this.views.buns.get(ev.bunId);
        const bun = this.state.buns.find((b) => b.id === ev.bunId);
        const e = this.state.enemies.find((x) => x.id === ev.enemyId);
        if (v && bun && e) {
          const s = v.sprite;
          this.tweens.killTweensOf(s);
          const tx = bun.x + (e.x - bun.x) * 0.45;
          const ty = bun.y + BUN_Y + (e.y - bun.y) * 0.45;
          this.tweens.add({ targets: s, x: tx, y: ty, scaleX: s.baseScale * 1.2, scaleY: s.baseScale * 0.85, duration: 120, ease: 'Back.easeOut' });
          v.chomp = this.tweens.add({ targets: s, angle: { from: -8, to: 8 }, duration: 110, yoyo: true, repeat: -1, delay: 120 });
          this.floatText(tx, ty - 40, '啊嗚！', css('chili'));
          this.fx.burst('star', e.x, e.y - 10, 3);
        }
        break;
      }
      case 'release': {
        const v = this.views.buns.get(ev.bunId);
        const bun = this.state.buns.find((b) => b.id === ev.bunId);
        if (v && bun) {
          const s = v.sprite;
          if (v.chomp) { v.chomp.remove(); v.chomp = null; }
          this.tweens.killTweensOf(s);
          s.angle = 0;
          this.tweens.add({
            targets: s, x: bun.x, y: bun.y + BUN_Y, scaleX: s.baseScale, scaleY: s.baseScale, duration: 220, ease: 'Back.easeOut',
            onComplete: () => { if (s.active) idleBreath(this, s); },
          });
        }
        break;
      }
      case 'produce': this.floatText(ev.x, ev.y - 40, `+${ev.amount}`); this.fx.puff(ev.x, ev.y - 40); break;
      case 'heal': {
        this.fx.burst('heart', ev.x, ev.y - 30, 2);
        this.floatText(ev.x, ev.y - 40, '+♥', css('chili'));
        break;
      }
      case 'repel': {
        this.ring(ev.x, ev.y, ev.range, P.matcha, 500);
        this.floatText(ev.x, ev.y - 46, '噗～', css('matcha'));
        break;
      }
      case 'freeze': this.ring(ev.x, ev.y, ev.range, 0xffffff, 500); this.floatText(ev.x, ev.y - 46, 'QQ！'); break;
      case 'burst': {
        this.ring(ev.x, ev.y, ev.radius * 1.4, P.chili, 380);
        this.fx.burst('star', ev.x, ev.y, 10);
        this.cameras.main.shake(140, 0.004);
        break;
      }
      case 'enemyDied': this.floatText(ev.x, ev.y - 30, `+${ev.bounty}`); break;
      case 'bunDied': {
        const v = this.views.buns.get(ev.bunId);
        if (v) { this.removeBunView(ev.bunId); poof(this, v.sprite, this.fx); this.drawHighlight(); }
        break;
      }
      case 'spawn':
        if (ev.boss) this.banner(str('bossIncoming'));
        break;
      case 'leak': {
        this.cameras.main.shake(180, 0.006);
        this.floatText(60, 260, `-${ev.damage}♥`, css('chili'));
        break;
      }
      case 'win': case 'lose':
        this.endBattle(ev.type === 'win', ev.stars || 0);
        break;
      default: break;
    }
  }

  banner(s) {
    const t = text(this, 480, 230, s, 44, { stroke: css('cream'), strokeThickness: 10, color: css('chili') }).setDepth(66);
    t.setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, delay: 1400, duration: 300, onComplete: () => t.destroy() });
    this.cameras.main.shake(300, 0.005);
  }

  showWavePreview(ev) {
    const items = Object.entries(ev.counts);
    const h = 44 + items.length * 52;
    const c = this.add.container(890, 60 + h / 2 + 10).setDepth(65);
    const bg = this.add.rectangle(0, 0, 110, h, P.cream, 0.94).setStrokeStyle(3, P.outline);
    c.add(bg);
    c.add(text(this, 0, -h / 2 + 18, str('incoming'), 18));
    items.forEach(([id, n], i) => {
      const y = -h / 2 + 58 + i * 52;
      const icon = makeSprite(this, -20, y, `enemy:${id}:0`);
      icon.setScale(icon.baseScale * 0.65);
      c.add(icon);
      c.add(text(this, 26, y, `×${n}`, 18));
    });
    c.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: c, alpha: 0, delay: 2300, duration: 250, onComplete: () => c.destroy() });
    this.waveText.setText(str('wave', { n: ev.index + 1, total: ev.total }));
    this.tweens.add({ targets: this.waveText, scale: 1.25, duration: 160, yoyo: true });
  }

  // ---------- 畫面與規則狀態同步 ----------

  addBunView(bun, animate) {
    const key = `bun:${bun.defId}`;
    const s = makeSprite(this, bun.x, bun.y + BUN_Y, key).setDepth(10 + bun.row);
    let badge = null;
    if (bun.lvl >= 2) {
      badge = makeSprite(this, bun.x + 24, bun.y - 28, bun.lvl >= 3 ? 'ui:crown' : 'ui:star').setDepth(11 + bun.row);
      badge.setScale(badge.baseScale * 0.8);
    }
    this.views.buns.set(bun.id, { sprite: s, badge });
    if (animate) {
      popIn(this, s);
      this.fx.puff(bun.x, bun.y - 30);
    }
    this.time.delayedCall(450, () => { if (s.active) idleBreath(this, s); });
    startBlink(this, s, key);
    this.drawHighlight();
  }

  removeBunView(id) {
    const v = this.views.buns.get(id);
    if (!v) return;
    if (v.badge) v.badge.destroy();
    this.views.buns.delete(id);
    this.drawHighlight();
  }

  sync() {
    const st = this.state;
    const v = this.views;
    const tSec = this.time.now / 1000;

    const seen = new Set();
    for (const e of st.enemies) {
      seen.add(e.id);
      const def = enemyDef[e.defId];
      let s = v.enemies.get(e.id);
      const y = e.y + (def.flying ? FLY_Y + Math.sin(tSec * 4 + e.id) * 4 : -4);
      if (!s) {
        s = makeSprite(this, e.x, y, `enemy:${e.defId}:0`).setDepth(20);
        const scale = def.boss ? 1.7 : def.look.big ? 1.3 : 1;
        s.setScale(s.baseScale * scale);
        s.baseScale *= scale;
        s.lastD = e.d;
        s.frameT = 0;
        v.enemies.set(e.id, s);
        s.setAlpha(0);
        this.tweens.add({ targets: s, alpha: 1, duration: 200 });
      }
      const moving = Math.abs(s.lastD - e.d) > 0.01 || def.flying;
      s.frameT += moving ? 1 : 0;
      s.setTexture(`enemy:${e.defId}:${Math.floor(s.frameT / (def.flying ? 8 : 12)) % 2}`);
      const dir = st.path.dirAt(e.d);
      const back = e.d < s.lastD;
      if (dir !== 0) s.setFlipX((dir > 0) !== back);
      if (!this.tweens.isTweening(s)) s.x = e.x;
      s.y = y;
      s.setDepth(20 + e.y / 100);
      s.angle = e.clampedBy !== null ? Math.sin(tSec * 30) * 10 : e.bitingId !== null ? Math.sin(tSec * 18) * 6 : 0;
      const frozen = (e.frozenUntil && st.t < e.frozenUntil) || e.clampedBy !== null;
      const slowed = e.slowUntil && st.t < e.slowUntil;
      const want = frozen ? 'f' : slowed ? 's' : null;
      if (want !== s.tintKey) {
        if (want === 'f') s.setTint(0xdff3ff);
        else if (want === 's') s.setTint(P.sakura);
        else s.clearTint();
        s.tintKey = want;
      }
      s.lastD = e.d;
    }
    for (const [id, s] of v.enemies) {
      if (!seen.has(id)) { v.enemies.delete(id); poof(this, s, this.fx); }
    }

    const seenB = new Set();
    for (const b of st.bullets) {
      seenB.add(b.id);
      let s = v.bullets.get(b.id);
      if (!s) {
        s = makeSprite(this, b.x, b.y, 'fx:bullet').setDepth(30);
        const tint = { taro: P.taro, charcoal: P.charcoal, liusha: P.yolk, cheeseliusha: P.yolk, sesame: P.cream, redbean: P.chili, boba: P.outline, veggie: P.matcha }[b.ownerDefId];
        if (tint) s.setTint(tint);
        if (b.ownerDefId === 'sesame') s.setScale(s.baseScale * 0.55);
        v.bullets.set(b.id, s);
      }
      s.x = b.x;
      s.y = b.y;
      s.angle += 8;
    }
    for (const [id, s] of v.bullets) {
      if (!seenB.has(id)) { v.bullets.delete(id); s.destroy(); }
    }

    const seenZ = new Set();
    for (const z of st.zones) {
      seenZ.add(z.id);
      if (!v.zones.has(z.id)) {
        const p = st.path.posAt(z.d);
        const s = makeSprite(this, p.x, p.y + 6, 'fx:puddle').setDepth(5);
        if (z.kind === 'oil') s.setTint(P.caramel);
        s.setScale(s.baseScale * 0.3);
        this.tweens.add({ targets: s, scale: s.baseScale * (z.length / 80), duration: 180, ease: 'Back.easeOut' });
        v.zones.set(z.id, s);
      } else if (z.kind === 'oil' && Math.random() < 0.08) {
        const s = v.zones.get(z.id);
        this.fx.burst('soup', s.x + Phaser.Math.Between(-20, 20), s.y, 1);
      }
    }
    for (const [id, s] of v.zones) {
      if (!seenZ.has(id)) {
        v.zones.delete(id);
        this.tweens.add({ targets: s, alpha: 0, duration: 200, onComplete: () => s.destroy() });
      }
    }

    const g = this.hpBars;
    g.clear();
    for (const e of st.enemies) {
      if (e.hp >= e.maxHp) continue;
      const def = enemyDef[e.defId];
      const w = def.boss ? 70 : 40;
      const y = e.y + (def.flying ? FLY_Y : 0) - (def.boss ? 58 : 36);
      g.fillStyle(P.outline, 0.6);
      g.fillRoundedRect(e.x - w / 2, y, w, 6, 3);
      g.fillStyle(P.chili, 1);
      g.fillRoundedRect(e.x - w / 2 + 1, y + 1, (w - 2) * Math.max(0, e.hp / e.maxHp), 4, 2);
    }
    for (const b of st.buns) {
      if (b.hp >= b.maxHp) continue;
      const y = b.y - 44;
      g.fillStyle(P.outline, 0.6);
      g.fillRoundedRect(b.x - 22, y, 44, 6, 3);
      g.fillStyle(P.matcha, 1);
      g.fillRoundedRect(b.x - 21, y + 1, 42 * Math.max(0, b.hp / b.maxHp), 4, 2);
    }
  }

  updateHud() {
    const st = this.state;
    this.steamText.setText(String(Math.floor(st.steam)));
    this.heartText.setText(`${st.hearts}/${HEARTS}`);
    for (const c of this.cards) {
      const def = c.def;
      const readyAt = st.cardReadyAt[def.id];
      const left = readyAt === undefined ? 0 : Math.max(0, readyAt - st.t);
      c.cd.setScale(1, left / def.cardCooldown);
      c.setAlpha(st.steam >= def.cost ? 1 : 0.55);
    }
  }

  endBattle(won, stars) {
    if (this.ended) return;
    this.selectCard(null);
    this.ended = true;
    this.hideInfo();
    this.highlight.clear();
    if (won) {
      for (const { sprite } of this.views.buns.values()) {
        this.tweens.add({ targets: sprite, y: sprite.y - 24, duration: 220, yoyo: true, repeat: 2, ease: 'Quad.easeOut' });
        this.fx.burst('heart', sprite.x, sprite.y - 20, 1);
      }
    }
    this.time.delayedCall(won ? 1100 : 700, () => {
      this.scene.start('ResultScene', { levelId: this.levelId, won, stars, loadout: this.loadout });
    });
  }
}

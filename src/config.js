// 所有座標都是 960×540 的遊戲像素。數值為起始值，可依試玩調整。

export const GAME_W = 960;
export const GAME_H = 540;

// 場地：左邊 80 像素是早餐店櫃台，右邊 11 欄 × 5 列的格子
export const FIELD = {
  left: 80,
  top: 60,
  cols: 11,
  rows: 5,
  cell: 80,
};

export const cellCenter = (c, r) => ({
  x: FIELD.left + FIELD.cell / 2 + FIELD.cell * c,
  y: FIELD.top + FIELD.cell / 2 + FIELD.cell * r,
});

export const CARD = { y: 464, w: 84, h: 72, gap: 6 };
export const LOADOUT_MAX = 8;

export const STEP = 1 / 60;
export const MAX_STEPS_PER_FRAME = 5;

export const STEAM = { start: 130, tick: 4.0, perTick: 15 };
export const HEARTS = 10;
export const SELL_REFUND = 0.5;

export const BULLET = { speed: 420, hitRange: 14 };
export const ENEMY = { halfLength: 22 };
export const ENEMY_RADIUS = 20;
export const CLAMP_IMMUNITY = 1;
export const FREEZE_IMMUNITY = 1.5;

export const WAVE = { firstPreviewAt: 1, previewDuration: 2.5 };

export const LEVEL_MUL = (lvl) => 1 + 0.3 * ((lvl || 1) - 1);
export const MAX_BUN_LEVEL = 3;

export const GACHA_WEIGHTS = { common: 60, rare: 30, super: 10 };

export const FONT_FAMILY = 'BaobaoRounded';
export const FONT_STACK = `${FONT_FAMILY}, "PingFang TC", "Microsoft JhengHei", sans-serif`;

export const SAVE_KEY = 'baobao:save';

export const PARTICLE_LIMITS = { steam: 60, soup: 40, star: 40, heart: 30, confetti: 30 };

export const MIN_BUTTON = 72;

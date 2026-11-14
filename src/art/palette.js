// 固定 12 色。所有美術只能使用這些顏色。

export const PALETTE = {
  cream: 0xfff6e5,
  dough: 0xf7e7ce,
  wood: 0xe8cda8,
  caramel: 0xd9a066,
  yolk: 0xf7c948,
  sakura: 0xf6b8c8,
  blush: 0xf49aa8,
  matcha: 0xa8c99a,
  taro: 0xc3a6d8,
  chili: 0xe5674e,
  charcoal: 0x5e5a5a,
  outline: 0x6b4a3a,
};

export const css = (name) => `#${PALETTE[name].toString(16).padStart(6, '0')}`;

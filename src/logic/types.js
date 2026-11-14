// JSDoc 型別定義。這個檔案沒有執行時的程式碼。

/**
 * @typedef {'noSteam'|'cooldown'|'occupied'|'laneClosed'|'notUnlocked'|'notEnough'|'failed'|'owned'} Reason
 */

/**
 * @typedef {Object} BunInstance
 * @property {number} id
 * @property {string} defId
 * @property {number} lane
 * @property {number} col
 * @property {number} x
 * @property {number} hp
 * @property {Object<string, number>} timers   各效果零件下次可以動作的時間
 * @property {number|null} clampTargetId
 * @property {number} clampEndsAt
 */

/**
 * @typedef {Object} EnemyInstance
 * @property {number} id
 * @property {string} defId
 * @property {number} lane
 * @property {number} x
 * @property {number} hp
 * @property {number|null} clampedBy
 * @property {number} noClampUntil
 * @property {number|null} bitingId   正在咬的包子 id
 */

/**
 * @typedef {Object} Bullet
 * @property {number} id
 * @property {number} lane
 * @property {number} x
 * @property {number} damage
 * @property {Array<Object>} onHit
 * @property {number} ownerId
 */

/**
 * @typedef {Object} Puddle
 * @property {number} id
 * @property {number} lane
 * @property {number} cx
 * @property {number} width
 * @property {number} slow
 * @property {number} endsAt
 */

/**
 * @typedef {Object} BattleEvent
 * @property {'waveStart'|'spawn'|'shoot'|'hit'|'splash'|'puddle'|'clamp'|'release'|'bite'|'bunDied'|'enemyDied'|'leak'|'place'|'win'|'lose'} type
 */

/**
 * @typedef {Object} BattleState
 * @property {number} t
 * @property {number} steam
 * @property {number} nextSteamAt
 * @property {number} leaks
 * @property {number} waveIndex             從 0 開始；-1 表示還沒開始
 * @property {'waiting'|'preview'|'spawning'|'clearing'|'done'} wavePhase
 * @property {number} phaseEndsAt
 * @property {string[]} spawnQueue
 * @property {number} nextSpawnAt
 * @property {BunInstance[]} buns
 * @property {EnemyInstance[]} enemies
 * @property {Bullet[]} bullets
 * @property {Puddle[]} puddles
 * @property {Object<string, number>} cardReadyAt
 * @property {null|'win'|'lose'} result
 * @property {number} nextId
 */

export {};

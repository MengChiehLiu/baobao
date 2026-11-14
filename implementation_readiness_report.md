# Goldfish Review Report: Stage 9 (Implementation Readiness Test)

**Target:** `C:\Projects\baobao\docs\designs\baobao.md` (DetailedRange: lines 300-633; lines 1-299 read for reference only)
**Mode:** REVIEW
**Standard:** `resources/document_standards/implementation-readiness-standard.md`. The style persona names no default standard, so the style reviewer used this one too.
**GoldfishContext:** none. Greenfield: every file is Create, so there are no non-existent-reference findings.

## Reviewer Status

| Reviewer | Status | Raw findings |
| --- | --- | --- |
| `egm-implementation-readiness` | completed | 2 Blocker / 15 Major / 10 Nit |
| `egm-codebase-details` | completed | 1 Blocker / 14 Major / 15 Nit |
| `egm-style` | completed | 0 Blocker / 13 Major / 7 Nit |

**After deduplication:** 3 Blocker / 17 Major / 17 Nit.

**Verdict:** NOT READY.

All three reviewers agree on the cause. The file list, the layer boundaries and the per-unit stat tables are solid. The plan breaks the Zero-Decision Rule in four areas, where it leaves game-design decisions to the implementer:

- wave and level content
- combat geometry
- bun unlock flow
- cross-layer data shapes

When two reviewers rated the same issue at different severities, the higher severity is used.

---

## Prioritized Findings (Blockers -> Major -> Nits)

### B1. Wave scheduling, lane numbering and `levels.json` content are left to the implementer - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 344-357, 411, 446, 550, 584
* **Discrepancy Description:**
  * Line 357 gives only a size formula (`3 + level + wave`). It then says "具體組合寫在 `levels.json`", which leaves the implementer to design about 37 waves: the enemy mix, lanes and delays.
  * Line 357's "該關已出現的敵人" is ambiguous. It could mean enemies new in this level, or every enemy up to this level.
  * The plan does not define:
    * what `delay` is measured from (wave start, previous spawn or battle start)
    * what starts the next wave (the previous wave being cleared, or a timer)
    * when the first wave starts
    * whether the 2 s preview on line 550 pauses spawning
    * whether there is a `waveStart` event (none is listed on line 447)
    * whether the wave index is 0-based or 1-based in the formula
  * Lane numbering is never defined, so "中間 3 條" (line 346) maps to no specific indices.
  * The win condition on line 584 ("所有波次清空") does not say whether enemies that reached the counter count as cleared.
* **Rationale & Recommendation:**
  * Either give the literal wave table for all 10 levels (enemy id, lane, spawn time), or give a fully deterministic generator rule.
  * Fix the rules:
    * Lanes are 0-4, top to bottom, and "middle 3" = `[1,2,3]`.
    * `delay` = seconds after the previous spawn (or after wave start; pick one).
    * The next wave starts 2 s after the previous wave's last enemy dies or leaks. That 2 s is the preview, and a `waveStart{index, enemies}` event is emitted when it begins.
    * The first wave starts at t = 3 s.
    * Win = every wave spawned and no enemies alive.

### B2. Combat mechanics, collision geometry and the `effects` schema are undefined - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 320-331, 403, 437-447 (related: 142, 155, 172)
* **Discrepancy Description:** `effects.js` and `battle.js` cannot be written without decisions the plan does not make.
  * **`effects` schema (line 403).** "效果零件和參數的陣列" has no structure. The plan cannot express "liusha's bullet creates a puddle on hit" or "cheeseliusha does splash + puddle on hit". It is unclear whether `onHit` effects nest inside `shoot` or sit in a flat list. The validator and the tests depend on this schema.
  * **`shoot`.**
    * No bullet speed, hit radius or range.
    * No rule on whether a bun fires only when an enemy is ahead in its lane.
    * No rule on which enemy a bullet hits or when bullets are removed.
    * The texts disagree on where liusha's puddle appears. Line 325 says where the bullet hits ("命中處"); line 172 says where the bullet lands ("子彈落地").
  * **Contact and leak.**
    * No enemy or bun width.
    * No x at which an enemy is "blocked" by a bun.
    * No exact spawn x inside the 840-960 zone.
    * No x threshold for "reached the counter" (≤ 120? ≤ 0?), and no rule on whether an enemy that leaks is removed.
  * **Steam and cards.** The plan doesn't say whether "+25 every 4 s" is a discrete tick, whether steam has a cap, or whether card cooldowns start ready.
  * **Ties.** No priority is given when win and lose happen in the same step.
* **Rationale & Recommendation:** Add a "Combat Mechanics" block to section 0 (and `config.js`) with concrete values. For example:
  * Bullets: speed 300 px/s. A bun fires only if an enemy in the same lane has x > bun.x. A bullet hits when |dx| ≤ 20 and is removed when x > 960.
  * Enemies: half-width 20. An enemy is blocked when `enemy.x - 20 <= cellRightEdge` of a bun in its lane. Spawn at x = 900. An enemy leaks when x ≤ 120; it is removed and `leak` is emitted.
  * Steam: +25 every 4.0 s of logic time, no cap. Every card starts ready.
  * Lose is checked before win.
  * Give a JSON example of `effects`, e.g. `[{"type":"shoot","damage":10,"interval":2,"onHit":[{"type":"puddle","width":80,"duration":2,"slow":0.5}]}]`.
  * Align line 172 with line 325.

### B3. No rule says when base buns are unlocked - Severity: Blocker
* **Reviewer Lens:** `egm-codebase-details` (Blocker), `egm-implementation-readiness` (Major), `egm-style`
* **Affected Scope:** Lines 346-354, 403, 464, 539, 556, 559, 604
* **Discrepancy Description:**
  * A new save unlocks only `charsiu` (line 464). No module (battle, gacha, fusion or ResultScene) ever adds `mantou`, `xiaolong`, `liusha` or `guabao` to `unlockedBuns`.
  * Line 556 shows "新解鎖的包子" on the win screen. However, ResultScene's save step (line 559) writes only ingredients and the clear status.
  * The validator rule on line 604 ("新包子在之前或這一關已經解鎖") is circular.
  * Without an unlock rule, the default loadout (line 539) can never include a level's new bun.
* **Rationale & Recommendation:**
  * Pick one rule and name the file that applies it:
    * (a) Entering level N adds `levels[N].newBuns`.
    * (b) Clearing level N for the first time adds `levels[N+1].newBuns`, and ResultScene shows and saves them.
  * Add a test for the chosen rule.
  * Rewrite the validator rule: every `newBuns` id exists and has `source: "base"`, and every base bun except `charsiu` appears in exactly one level's `newBuns`.

---

### M1. Splash, clamp, puddle and flying rules are ambiguous, and the fusion buns lack parameters - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 324-331, 340, 438-439, 592 (related: 158)
* **Discrepancy Description:**
  * **Splash.**
    * The distance metric is not stated (2D, or x-only). Lanes are 80 px apart, so `charcoal`'s 90 px radius reaches the neighbouring lanes only under 2D distance. Whether splash crosses lanes is therefore an undocumented side effect.
    * It is unclear whether the main target takes bullet damage plus splash damage.
  * **Clamp.**
    * "前方 1 格內" doesn't say whether the bun's own cell counts.
    * The 4 s cooldown doesn't say whether it starts at clamp or at release.
    * Line 326 calls this "冷卻", the same word as the card-cooldown column.
    * It is undefined whether a clamped enemy keeps biting.
  * **Fusion buns.** `cheeseliusha` (line 330) has no puddle width, duration or multiplier. `chiliguabao` (line 331) has no range and no cooldown.
  * **Flying.** Line 340 says "不被 `block` 擋", but line 158 says "不會被饅頭擋住". It is unclear whether a pigeon passes every bun. If a non-block bun stops a pigeon, the pigeon (bite 0) stays there forever.
  * **Puddle.** It is unclear whether "寬 1 格" is centred on the hit x or snapped to a cell.
* **Rationale & Recommendation:** State each rule. For example:
  * Splash: 2D Euclidean distance from the impact point, so it can cross lanes. Say whether the main target also takes splash damage. Add a test for radius 90 crossing lanes.
  * Clamp: range (bun.x, bun.x + 80]. The clamp interval starts at release. Rename it "再夾間隔" so "冷卻" means card cooldown only. A clamped enemy does not bite.
  * `chiliguabao`: same range, 4 s interval.
  * `cheeseliusha`: puddle 80 px, 2 s, ×0.5, centred on the hit x.
  * Flying enemies ignore collision with every bun.

### M2. Return shapes, state shape and function signatures are undefined - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 437, 444-447, 452, 456, 548, 580, 598-599
* **Discrepancy Description:**
  * `place` returns "成功或失敗原因", `drawBun` returns "錯誤", and `fuse` returns "`failed`" or an error, but none of these shapes is defined. Line 548 needs a reason code it can map to text such as "蒸氣不夠".
  * The fields of `state`, of bun and enemy instances, and of projectiles, puddles and events are not defined. Line 547 needs stable ids, and the plan doesn't say where they come from.
  * `createBattle(levelData, loadout, rng)` receives no bun or enemy definitions, so either `battle.js` imports the JSON directly, which makes test fixtures harder, or the signature is incomplete.
* **Rationale & Recommendation:**
  * Add JSDoc typedefs: `BattleState`, `BunInstance`, `EnemyInstance`, `Projectile`, `Puddle`, `BattleEvent`.
  * Use one result union, `{ok:true, ...} | {ok:false, reason}`, with reasons `noSteam | cooldown | occupied | laneClosed | noTicket | allOwned | notEnough | failed`.
  * Map each reason to a key in `strings.json`.
  * Change the signature to `createBattle(levelData, loadout, defs:{buns, enemies}, rng)`.

### M3. The plan doesn't say who clears `state.events`, or what happens around the step cap - Severity: Major
* **Reviewer Lens:** `egm-style` (Major), `egm-implementation-readiness` (Nit), `egm-codebase-details` (Nit)
* **Affected Scope:** Lines 447, 545
* **Discrepancy Description:**
  * "畫面處理完就清空" names no actor. At 2x speed, `step` runs several times per frame, so whether `step` clears the events or the scene does changes which events survive.
  * The plan also doesn't say:
    * what happens to leftover accumulated time when the 5-step cap is hit
    * whether stepping stops after `win`/`lose`
* **Rationale & Recommendation:**
  * `step` only appends to `state.events`. `BattleScene` drains the list once per frame, after all of that frame's `step` calls.
  * Leftover time is discarded when the cap is hit.
  * Stepping stops after `win`/`lose`.

### M4. The validator's "all numbers positive" rule rejects the plan's own data - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Line 604 (conflicts with line 340)
* **Discrepancy Description:** The pigeon has `bite: 0`, and a wave `delay` can legitimately be 0. `python tools/validate_data.py` (line 622) would therefore fail on correct data.
* **Rationale & Recommendation:** List the rules per field:
  * `hp`, `speed`, `cost` and `cardCooldown` > 0
  * `bite` and `delay` ≥ 0
  * `slow` in (0, 1)
  * `lane` is in the level's `lanes` or equals `"random"`

### M5. The ticket-reward table contradicts the earlier sections - Severity: Major
* **Reviewer Lens:** `egm-style`, `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 344-355, 359 (conflicts with lines 64, 162 and 177)
* **Discrepancy Description:**
  * The table gives tickets only for levels 2, 4 and 6. Line 162 says every first clear gives a ticket, and CUJ 1 (line 64) shows a ticket after level 1.
  * Line 177 says "at most one new bun or enemy per level", but levels 1 and 3 each add both a bun and an enemy.
* **Rationale & Recommendation:**
  * Keep the table as the source of truth and add the sentence "只有第 2、4、6 關首次過關給包子券，共 3 張".
  * Correct lines 64 and 162 to match.
  * Change line 177 to "at most one new bun and one new enemy".

### M6. The drop rules are incomplete and ingredient ids are never defined - Severity: Major
* **Reviewer Lens:** `egm-style`, `egm-codebase-details`, `egm-implementation-readiness`
* **Affected Scope:** Lines 349, 351, 353, 358, 411, 415
* **Discrepancy Description:**
  * The table says "開始掉落", which suggests drops carry over to later levels. Line 358 says "從這關的掉落清單", which suggests each level has its own list.
  * Ingredient ids are never given, yet `recipes.json`, `levels.json` and the tests all reference them.
  * The plan doesn't say whether drops are picked up automatically.
* **Rationale & Recommendation:**
  * Define the ids: `cheese`, `saltedegg`, `chili`, `braisedpork`.
  * State that drops are cumulative, and list `drops` for each level as a table column. For example: levels 4-5 `[cheese, saltedegg]`; levels 6-7 add `braisedpork`; levels 8-10 add `chili`.
  * State that pickup is automatic when the enemy dies.

### M7. Fusion edge cases are undecided - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 368, 456, 571
* **Discrepancy Description:**
  * Is the same ingredient twice (`cheese` + `cheese`) allowed, and does it need 2 in stock?
  * When the result bun is already unlocked, are ingredients still deducted, and what is shown?
  * Can a filled Steamer slot be cleared?
* **Rationale & Recommendation:** Decide each case and write it down. For example:
  * Two of the same id is allowed, needs a count of ≥ 2, and always fails.
  * An already-owned result is blocked with `reason: 'owned'` and no deduction. Alternatively, it succeeds with a "已經有了" message.
  * Tapping a filled slot empties it.
  * Add a test for each case.

### M8. The lockfile is missing, and the deploy workflow is underspecified - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 372-374, 378, 393, 397
* **Discrepancy Description:**
  * `npm ci` fails without a committed `package-lock.json`, and that file is not in the file list. The file list is the write allowlist, so the implementer cannot add it.
  * `deploy.yml` doesn't give:
    * the Node version
    * the actions and their versions
    * `permissions` (`pages: write`, `id-token: write`) or `concurrency`
  * Two requirements go unstated:
    * The repo needs a one-time manual setting: Settings > Pages > Source = "GitHub Actions".
    * `base: '/baobao/'` assumes the repo is named `baobao`.
* **Rationale & Recommendation:**
  * Add `package-lock.json` (Create, generated by `npm install`, committed).
  * Write out the jobs:
    * `actions/checkout@v4`
    * `actions/setup-node@v4` (Node 22, npm cache)
    * `actions/configure-pages@v5`
    * `actions/upload-pages-artifact@v3` (path `dist`)
    * `actions/deploy-pages@v4`, in a `deploy` job with `environment: github-pages`
  * The reviewers gave these as current major versions but not confirmed. Verify them when implementing.
  * Document the Pages setting and the repo-name assumption in the README.

### M9. The `localStorage` test environment is unspecified - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 374, 462, 600
* **Discrepancy Description:**
  * Vitest's default environment is `node`, where `localStorage` is missing or experimental depending on the Node version. Neither reviewer could confirm usable built-in support.
  * Testing "localStorage throws" needs a stubbing strategy, and the plan gives none.
* **Rationale & Recommendation:**
  * Preferred, with no new dependency: make `save.js` accept an injectable storage (`load(storage = globalThis.localStorage)`), or use `vi.stubGlobal('localStorage', fake)` with a Map-based fake and a version that throws.
  * Alternatively, add `jsdom` as a dev dependency on line 374 and use `// @vitest-environment jsdom`.

### M10. Drawing textures at 2x likely does not make edges sharper with this scale configuration - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness` (fairly confident), `egm-codebase-details` (high confidence)
* **Affected Scope:** Lines 496, 517 (and line 195)
* **Discrepancy Description:**
  * With a 960×540 game size and `Scale.FIT`, the canvas backing store stays 960×540 and CSS stretches it. A texture drawn at 2x and shown at 0.5x is still rendered into a 960×540 canvas, so high-DPI phones won't show sharper edges.
  * The plan also never says that sprites using 2x textures must be shown at `setScale(0.5)`.
* **Rationale & Recommendation:** Either:
  * Use a 1920×1080 game size, with `cameras.main.setZoom(2)` and `centerOn(480, 270)` in each scene, so the 960×540 logical coordinates are kept. Or
  * Drop the sharpness claim and draw at 1x.

  In both cases, state the display scale. Confirm the result with a quick on-phone prototype, since this is based on model knowledge of Phaser 3.90.

### M11. The font pipeline has gaps: family name, URL under `base`, glyph coverage and the subset call - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 383-385, 423, 525, 549, 609-611
* **Discrepancy Description:**
  * No `font-family` name is given. `@font-face`, `document.fonts.load` and every Phaser text style need the same name.
  * No URL is given for the woff2 file under `base: '/baobao/'`. A hard-coded `/fonts/...` may return 404 on Pages, and neither reviewer could confirm whether Vite rewrites URLs in an inline `<style>`.
  * The portrait overlay is static HTML, so its text is not in `src/data/*.json`. Its glyphs will not be kept in the subset font. Characters such as "×" and "／" (line 549) also need to be collected.
  * The `pyftsubset` call (CLI or `fontTools.subset.main`, and its flags) is not given.
  * There is no fallback if `document.fonts.load` fails or hangs.
* **Rationale & Recommendation:**
  * Add `FONT_FAMILY = 'Huninn'` to `config.js`.
  * Use the relative URL `url('./fonts/huninn-subset.woff2')` or `%BASE_URL%`, with `font-display: block`, and verify it in the `vite build` output.
  * Either have `subset_font.py` also scan `index.html`, or fill the overlay text from `strings.json`.
  * Give the exact call: `fontTools.subset.main([src, '--text-file=...', '--flavor=woff2', '--output-file=...', '--layout-features=*'])`.
  * Add a 3 s timeout fallback around the font load.

### M12. Scene handoff, shared save state and loadout order are undefined - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 517, 525, 533-559
* **Discrepancy Description:**
  * Scene keys are not listed.
  * The plan doesn't say where the loaded save lives after BootScene.
  * The data passed between LevelSelect, Battle, Result and the retry path is not defined.
  * "前 6 種" (line 539) has no order.
  * The interaction for changing the loadout is not described.
* **Rationale & Recommendation:**
  * Scene keys are the class names.
  * Store the save in `this.registry.set('save', ...)` and replace it after each `save()`.
  * Battle receives `{levelId, loadout}`. Result receives `{levelId, loadout, won, drops, firstClear}`. Retry uses `scene.start('BattleScene', {levelId, loadout})`.
  * The default loadout is the first 6 unlocked buns in `buns.json` order. Tapping a card toggles it, and a 7th tap does nothing.

### M13. The art parameters are undecided - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** Lines 383, 403, 407, 415, 470, 474-492, 511, 529
* **Discrepancy Description:**
  * **Palette.** It is "約 12 個" colours, but only 10 names are listed and no hex values are given. Line 383 says "奶油色" while the palette says "奶油白".
  * **`look` fields.**
    * They have no allowed values.
    * "頂部樣式" and "頂部裝飾" look like synonyms.
    * No `look` values are given for any bun, enemy or ingredient.
  * **Subjective directions.** "柔和", "偏低", "距離寬", "淘氣", "緩慢往上飄" and "幾顆" cannot be checked.
* **Rationale & Recommendation:**
  * Add a palette table with names and hex values, and use those names everywhere.
  * Define the `look` keys as enums, e.g. `body: round|oval|square|folded`, `topShape`, `topping`, `face`.
  * Add a per-unit `look` table.
  * Replace the adjectives with numbers. For example: shadow alpha 0.15; face centre at 60% of body height; eye spacing 40% of body width; steam rising at 20 px/s; "3 顆包子".
  * If art tuning is deliberately left to the implementer, say so explicitly, and fix only the schema and the palette.

### M14. The plan has no phases or checkpoints - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Lines 370-616
* **Discrepancy Description:** The standard requires stages that each leave the project buildable and testable. Here, sections 1-6 are grouped by layer, and every test comes last in section 6.
* **Rationale & Recommendation:** Reorder into phases, each with its own exit check:
  1. Scaffold, plus `rng` and `save` with their tests. Exit: `npm test` and `npm run build` pass.
  2. Data, plus `effects`, `battle` and the validator with their tests.
  3. Art, plus Boot and Title. Exit: textures show on a phone.
  4. Battle and Result. Exit: level 1 is playable.
  5. Gacha, Steamer, font subsetting and deployment.

### M15. Test cases lack setups and expected values, and key cases are missing - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 577-600
* **Discrepancy Description:**
  * Cases such as "叉燒包能打倒同車道的螞蟻" give no positions, step counts or expected timing.
  * "完全相同的結果" (line 585) doesn't say what is compared.
  * Tests don't say whether they use inline fixtures or the real JSON.
  * Missing cases:
    * fusion success deducts exactly 1 of each ingredient and unlocks the bun
    * gacha with all buns owned returns `allOwned`
    * gacha uses up 1 ticket
    * a bun dies at 0 HP and the enemy moves on
    * a puddle expires after 2 s
    * clamp damage total (90)
    * the clamp interval
    * steam income and the kill bonus
    * the 10% drop with a seeded RNG
    * wave progression
    * a new save holds only `charsiu`
    * bun unlock on clear (see B3)
* **Rationale & Recommendation:**
  * Require inline fixtures, and give each case a setup and an expected value. For example: charsiu in col 0; ant spawned at x 900; run N steps; expect `enemyDied` before the ant reaches x ≤ 200.
  * Define determinism as: the same seed and the same inputs give a deep-equal `state` and an identical event sequence.
  * Add the missing cases.

### M16. 「格」 means both "grid cell" and "render frame" - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 545, 626 (line 286 for reference)
* **Discrepancy Description:**
  * Lines 311, 445 and 548 use 「格」 for an 80×80 cell. Line 545 uses it for a frame ("每一格畫面…每格最多跑 5 步").
  * "Five steps per 格" can therefore be read as five steps per cell.
* **Rationale & Recommendation:** Use 「幀」 for render frames everywhere, and keep 「格」 for grid cells only.

### M17. The verification criteria cannot be measured - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 600, 626
* **Discrepancy Description:** "遊戲不會壞掉" and "畫面仍然流暢，沒有明顯卡頓" cannot be checked, even though the NFR (line 286) already gives a number.
* **Rationale & Recommendation:**
  * Line 600: "`localStorage` 拋出例外時，`load()` 回傳新存檔、`save()` 不拋出例外".
  * Line 626: "第 10 關最後一波時 `game.loop.actualFps` 持續 ≥ 30".

---

### N1. Two different functions are named `drawBun` - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Lines 452, 474
* **Discrepancy Description:** `logic/gacha.js` and `art/drawBun.js` both export a `drawBun`.
* **Rationale & Recommendation:** Rename the gacha function, e.g. `pullGacha`.

### N2. `package.json` scripts and fields are not exact - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 374, 397, 623
* **Discrepancy Description:**
  * Plain `vitest` runs in watch mode locally.
  * `"type": "module"` and `"private": true` are not specified.
  * `vite --host` is not on PATH.
* **Rationale & Recommendation:**
  * Use `dev: vite`, `build: vite build`, `preview: vite preview`, `test: vitest run`.
  * Add `"type": "module"` and `"private": true`.
  * Write `npm run dev -- --host` instead of `vite --host`.

### N3. `.gitignore` patterns are not exact - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Line 389
* **Rationale & Recommendation:** List `node_modules/`, `dist/`, `__pycache__/`, `*.pyc` and `.venv/`.

### N4. The production RNG seed and value range are unstated - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Line 433
* **Rationale & Recommendation:**
  * Seed with `Date.now() >>> 0` for each battle and each gacha draw.
  * Write the range as "[0, 1)".

### N5. The gacha "效果說明" has no data source - Severity: Nit
* **Reviewer Lens:** all three
* **Affected Scope:** Lines 403, 564
* **Rationale & Recommendation:** Add a `desc` field to `buns.json`. The subset script then also collects its characters.

### N6. The particle limit needs a budget per emitter - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 429, 511
* **Discrepancy Description:** Phaser has no global particle cap. The plan also doesn't say who generates the particle textures.
* **Rationale & Recommendation:**
  * Give each emitter its own `maxParticles` so they sum to 200, e.g. steam 60, soup 40, stars 40, hearts 30, confetti 30.
  * Generate the particle textures inside `generateAll`.

### N7. The battle keeps running behind the portrait overlay - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Line 385
* **Rationale & Recommendation:** Pause `BattleScene` when `matchMedia('(orientation: portrait)')` changes to portrait.

### N8. iOS Safari ignores `user-scalable=no` - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Line 383
* **Rationale & Recommendation:** State that zoom prevention relies on `touch-action: none` on `body` and the canvas.

### N9. The `hurt` white flash depends on WebGL - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Line 505
* **Discrepancy Description:** `setTintFill` works only in WebGL.
* **Rationale & Recommendation:** Specify the renderer: `Phaser.AUTO` with a Canvas fallback, or force WebGL.

### N10. "至少 40 像素" doesn't say which pixels - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Line 488
* **Rationale & Recommendation:** Say whether this means logical (960×540) pixels or texture pixels.

### N11. Animation timings are hedged or missing - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 501-506
* **Discrepancy Description:**
  * "約 350 毫秒" is hedged, and the timing of each stage is not given.
  * "輕微" adds nothing next to ±3%.
  * The random offset, "再彈出去", "閃白" and `poof` have no durations.
* **Rationale & Recommendation:** Give each stage in ms (e.g. 80/100/170) and the random offset range (0-1.8 s).

### N12. jf-openhuninn version, release file name and licence details are unconfirmed - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 610, 611, 614
* **Discrepancy Description:**
  * Neither reviewer could confirm that version 2.1 exists or that the release asset is named exactly `jf-openhuninn-2.1.ttf`. It may ship inside a zip.
  * The OFL licence itself is believed correct, but a Reserved Font Name clause, if present, would require renaming the subset.
* **Rationale & Recommendation:**
  * Add the exact repo URL and release tag.
  * Check the licence for a Reserved Font Name.
  * Pin the `fonttools` and `brotli` versions.

### N13. CI does not run the data validator - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Line 393
* **Rationale & Recommendation:** Add `python3 tools/validate_data.py` before the build. Python is already on `ubuntu-latest`.

### N14. Two enemy-trait cells duplicate other data - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 337, 339
* **Discrepancy Description:** "成群出現" describes wave content and "快" repeats the speed column. Neither is a field in `enemies.json`.
* **Rationale & Recommendation:** Replace both with "—" or remove them.

### N15. The recipe hint and example disagree with section 6 - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Line 365 (conflicts with lines 187 and 190)
* **Discrepancy Description:**
  * The hint "會牽絲的 + 會爆漿的" differs from line 190's "黏黏的 + 會爆漿的".
  * Line 187's example uses "流沙", which is not an ingredient.
* **Rationale & Recommendation:** Use one hint string, and correct the earlier example.

### N16. Filler word - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Line 359
* **Rationale & Recommendation:** Drop "剛好": "3 張包子券對應 3 種抽獎包子".

### N17. The README should cover first-time setup - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details` (derived from M8)
* **Affected Scope:** Line 397
* **Rationale & Recommendation:** Add the Pages source setting, the repo-name requirement and the `npm run dev -- --host` command to the README contents.

---

## Library and Tool Facts Checked (model knowledge only)

**Considered correct by the reviewers:**
* Phaser 3.90.0 exists. `Scale.FIT`, `CENTER_BOTH`, `Graphics.generateTexture` and `Back.easeOut` are valid.
* Vitest 3 works with Vite 6.
* `pyftsubset` with `--flavor=woff2` needs `brotli`.

**Flagged as uncertain:**
* The jf-openhuninn 2.1 release asset name (N12).
* Whether Vite rewrites the font URL inside inline `index.html` CSS (M11).
* Node's built-in `localStorage` support (M9).
* The exact current major versions of the GitHub Pages actions (M8).
* The 2x texture sharpness behaviour (M10), which should be confirmed with an on-device prototype.

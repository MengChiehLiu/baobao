# Goldfish Review Report: Stage 5 (Initial Zoom Out)

**Target:** `C:\Projects\baobao\docs\designs\baobao.md` (`1-633`). The document is in Traditional Chinese; this report is in English.
**Mode:** REVIEW
**GoldfishContext:** none. There is no codebase yet.

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-zoom-out` | completed |
| `egm-inventive-catalyst` | completed |

**Severity breakdown (after deduplication):** 0 Blocker, 8 Major, 7 Nit.

**Overall verdict:** Approve with changes. Both reviewers agree that the core architecture is the right size for a hobby game:
- Game data lives in JSON files.
- The game rules are pure JavaScript, deterministic and seeded, and run on a fixed timestep.
- Art is drawn in code.
- Phaser is used only for rendering and input.

Other choices both reviewers approve:
- Five shared effect components, instead of custom code for each bun.
- Straight lanes with no pathfinding (Alternative H).
- Art drawn in code (Alternative D).
- The portrait-orientation warning done in CSS.

The findings below concern how much machinery the unlock systems need, gaps in validation and deploy, the risk of losing save data, and testing the design later than necessary.

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Saves are wiped whenever the save format changes, and every push to `main` deploys to her - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Lines 205, 461-462 (§8 Save, item 19 `src/save.js`); also 391-393 (auto-deploy) and 44 (non-goal)
* **Discrepancy Description:** The non-goal at line 44 accepts rare save loss that she causes herself, such as clearing browser data or switching phones. Lines 205 and 462 add a loss the developer causes: if the stored version differs from the code's version, the save is reset. Every push to `main` deploys straight to the URL she plays, so any change to the save format, such as a new field added after playtesting, erases her progress.
* **Rationale & Recommendation:** These two goals don't actually conflict. Make `load()` merge what it reads into a fresh default save (`{...defaultSave(), ...parsed}`), and reset only if JSON parsing fails. Add a small `migrations[v]` chain for the rare case where a field changes meaning. Add a test: a v1 save loaded by v2 code keeps `cleared`, `tickets` and `ingredients`.

### 2. iOS Safari can delete `localStorage` after 7 days without a visit - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Lines 44, 54, 203, 462, 628 (§8 Save, §9 mobile support, Verification Plan)
* **Discrepancy Description:** On iPhone, Safari's tracking prevention deletes `localStorage` written by a site's scripts after 7 days of Safari use without interacting with that site. A casual player can easily go a week without playing. The test at line 628 (close and reopen the browser) won't catch this.
* **Rationale & Recommendation:** Add a minimal `manifest.webmanifest` and the `apple-mobile-web-app-capable` meta tag, and tell her to use "Add to Home Screen". Home-screen web apps are not subject to the 7-day deletion, and they open full-screen in landscape, which also helps §9. Call `navigator.storage.persist()` on the first tap. Tell her to always open the game from one place, because the home-screen app and Safari tabs keep separate storage on iOS.

### 3. No build order or early check of the riskiest assumptions; difficulty is first tested on her - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (merged)
* **Affected Scope:** Lines 30, 240-244 (Alternative E), 250, 276-280 (Alternative K), 300-616 (implementation plan), 629
* **Discrepancy Description:** The main success criterion is that she enjoys the game and reaches level 10 without explanation (line 30). The two riskiest assumptions are that code-drawn art looks good and that the difficulty is right. Line 280 accepts learning about both only at the end. Items 1-42 are grouped by file type, not by build order. Nothing makes the features that line 250 says to cut first (gacha, fusion) come last. The only planned playtest (line 629) covers levels 1-3, after everything is built.
* **Rationale & Recommendation:** No early delivery to her is needed (Alternative K stays rejected).
  - (a) Add a build order inside the implementation plan:
    1. Rules, data and battle for levels 1-3, playtested on her phone model.
    2. All 10 levels, all enemies and the Result scene.
    3. Art polish.
    4. Gacha, then fusion.
  - (b) Because the rules layer is pure and seeded, add `tests/balance.test.js` (or `tools/simulate`). A greedy scripted bot plays each level using only the buns she could have by then, and the test asserts each level is winnable with a clear margin.
  - (c) Add a dev-only `?level=N&unlockAll` URL parameter (guarded by `import.meta.env.DEV`). Optionally add a dev-only art gallery scene that reuses `generateAll`.
  - A human playtest is still needed to judge feel.

### 4. JSON checks and font coverage are not part of CI/deploy - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (merged)
* **Affected Scope:** Lines 38, 94, 280, 391-393 (item 5 `deploy.yml`), 602-604 (item 40), 606-612 (item 41), 622, 627
* **Discrepancy Description:** Editing JSON is the advertised safe way to tune the game without code (line 38), but `deploy.yml` runs only `npm ci`, `npm test` and `npm run build`. The data validation is a separate Python script (`validate_data.py`) that is run by hand. Broken references, duplicate ids, or Chinese characters missing from the subset font can therefore deploy straight to her phone. Missing characters show as empty boxes and would only be caught by manual device testing (line 627).
* **Rationale & Recommendation:** Prefer moving the data checks into a Vitest file (`tests/data.test.js`), so a single `npm test` covers everything, and delete `validate_data.py`. Keep Python only for font subsetting, where fontTools is the standard tool. Add a check that every CJK character in `src/**/*.{js,json}` exists in the committed `huninn-subset.woff2`; comparing against a character list written next to the font is enough. As an alternative, install Python in CI and run both tools there.

### 5. The gacha is not actually random: it is a fixed unlock with an animation - Severity: Major
* **Reviewer Lens:** `egm-zoom-out` (corroborated by `egm-inventive-catalyst` finding on ticket/bun coupling)
* **Affected Scope:** Lines 32-33, 72-76, 179-184, 359, 451-452 (item 17), 561-566 (item 35), 598
* **Discrepancy Description:** There are exactly 3 tickets (from levels 2, 4 and 6), 3 gacha buns, and no repeats, so she always gets all 3 buns and only the order is random. That small amount of randomness still requires:
  - a ticket currency;
  - an "all drawn" state;
  - `drawBun` with error paths;
  - random-number wiring;
  - gacha tests;
  - a disabled-button state.

  The "3 tickets = 3 buns" match is a coincidence of two data files and nothing checks it. A future gacha bun would be unreachable without any warning.
* **Rationale & Recommendation:** Keep the gacha scene and its capsule animation, since that is the fun part. Make the first clear of levels 2, 4 and 6 grant a pull directly, or reveal the buns in a fixed order. That removes `tickets` from the save and most of `gacha.js`. If real randomness is wanted, add duplicates or a larger pool and say so. If tickets stay, add a validator rule: total ticket rewards >= number of gacha buns.

### 6. Fusion has a lot of machinery (random drops, a currency, recipe lookup) for 2 late-game buns - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 42, 70, 78-82, 161-163, 186-191, 349-352, 358, 361-368, 413-419 (items 10-11), 454-456 (item 18), 557, 568-573 (item 36)
* **Discrepancy Description:** Fusion needs:
  - 4 ingredients with a 10% drop chance and per-level drop tables;
  - a `drop` event and a rule that drops are kept after a loss;
  - an ingredient inventory in the save;
  - `recipes.json` with a sorted-key lookup.

  All of that unlocks 2 buns. Chili first drops at level 8, so the chili fusion bun is useful in levels 9-10 at most. Random drops can force her to replay earlier levels to farm ingredients, which conflicts with "easy, no explanation needed" (line 30). Line 42 rules out a collection system, yet this is a small one.
* **Rationale & Recommendation:** Give fixed ingredient rewards on first clear (for example, level 4 gives cheese and salted yolk, level 8 gives chili and braised pork). Remove the drop chance, the `drops` field, the `drop` event and the "keep drops after a loss" rule. Keep the steamer scene, recipes and the ugly-bun failure as the fun part. Consider granting the chili ingredients earlier.

### 7. The loadout limit of 6 buns conflicts with "each level teaches one new bun" - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (merged; the reviewers propose different fixes)
* **Affected Scope:** Lines 29, 140, 177, 346-354, 535-540 (item 32), 539
* **Discrepancy Description:** The default loadout is the "first 6 unlocked" buns (line 539). By level 7 she can own 7 buns, so the 刈包 that level 7 is meant to teach can be left out by default. The limit also adds a selection step and a default rule for a casual player, even though at most 10 buns ever exist.
* **Rationale & Recommendation:**
  - **Preferred (zoom-out):** Remove the limit and the picker, and show every unlocked bun. 10 cards at about 90 px each fit in the 960 px card bar and stay above the 48 px tap target (line 209). If space gets tight, hide base buns that have an upgraded variant.
  - **Alternative (inventive-catalyst), if the limit is kept for strategy:** Build the default loadout as `level.newBuns` first, then the most recently unlocked buns, capped at 6. Add a test that level 7's default includes `guabao`.

### 8. The rules for ticket rewards contradict each other - Severity: Major (must be fixed before implementation)
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 64, 162, 344-359
* **Discrepancy Description:** Line 162 says every first clear gives 1 ticket, and CUJ 1 (line 64) shows a ticket after level 1. The level table gives tickets only at levels 2, 4 and 6, and line 359 depends on there being exactly 3.
* **Rationale & Recommendation:** Choose one rule: the table's, or whatever finding 5 replaces it with. Then update line 162 and CUJ 1 to match. The zoom-out reviewer rated this Nit; it is raised to Major here because an implementer cannot resolve it without guessing.

### 9. Font subsetting is manual, and `strings.json` exists mainly to feed it - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 199, 421-423 (item 12), 606-612 (item 41), 627
* **Discrepancy Description:** "Re-run after changing Chinese text" (line 612) is easy to forget. The rule that code may contain no Chinese text, only references to `strings.json` (line 423), adds a translation-style layer to a game in one language, mainly so the subsetter knows which characters to keep.
* **Rationale & Recommendation:** Have `subset_font.py` scan `src/**/*.{js,json}` for CJK characters directly, and relax the rule. Pair this with the coverage check in finding 4.

### 10. The audio stub and Open Question 2 are unresolved - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 55, 211, 519-521 (item 28), 529
* **Discrepancy Description:** `audio.js` has a `play()` that does nothing, plus unlock wiring for a feature the doc hasn't committed to.
* **Rationale & Recommendation:** Answer Open Question 2. If v1 has no sound, delete item 28 and the unlock wiring in the Title scene. If sound effects are likely, keep only `unlockAudio`.

### 11. Tween values, draw order and the PRNG algorithm are too detailed for a design doc - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 433 (item 14), 474-484 (item 21), 500-507 (item 25)
* **Discrepancy Description:** Exact squash ratios, easing names, millisecond timings, the 8-step draw order and the PRNG algorithm name are tuning details. Writing them into the design means the spec and the code will drift apart as the art is adjusted in-game (line 47).
* **Rationale & Recommendation:** Keep the animation names and what each one conveys. Move the numbers into constants in `anims.js` as starting values. "Seedable PRNG" is enough in the doc.

### 12. Wave composition has two sources of truth, and the enemy preview appears twice - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 357, 411, 540, 550
* **Discrepancy Description:** Line 357 gives a formula for enemies per wave but also says the waves are written by hand in `levels.json`. The enemy preview appears both on level select (line 540) and before each wave (line 550).
* **Rationale & Recommendation:** Declare `levels.json` authoritative and call the formula a guideline. Keep only the per-wave preview in battle.

### 13. Fixed-step loop: what happens to time beyond the 5-step cap at 2x speed is unspecified - Severity: Nit
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Lines 37, 545 (item 33 BattleScene)
* **Discrepancy Description:** At 30 fps and 2x speed, the loop already needs 4 steps per frame. Below about 24 fps it hits the 5-step cap. The doc doesn't say whether the extra time is dropped or carried over to the next frame; carrying it over causes repeated stalls.
* **Rationale & Recommendation:** Specify `acc = Math.min(acc, step)` after hitting the cap, which drops the extra time and gives intentional slow motion. Optionally scale the cap with game speed. Unit-test it with fake frame times.

### 14. `state.events` is changed by both the rules layer and the scene - Severity: Nit
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Line 447 (rules/scene event contract)
* **Discrepancy Description:** The rules layer writes events and the scene clears them, so two layers mutate the same shared state.
* **Rationale & Recommendation:** Have `step()` return the events from that step instead. The extra allocation is negligible at this scale.

### 15. The doc does not record what should stay - Severity: Nit (informational)
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst`
* **Affected Scope:** Lines 96-113, 441-448, Alternatives D and H
* **Discrepancy Description:** None. These were judged to be real constraints chosen on purpose, not false compromises.
* **Rationale & Recommendation:** Keep the rules/Phaser split, the event list, shared effect components, straight lanes, art drawn in code, and the CSS portrait warning.

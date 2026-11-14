# Goldfish Review Report: Stage 8 (Intermediate Zoom Out)

**Target:** `C:\Projects\baobao\docs\designs\baobao.md` (`1-633`, unchanged since Stage 5)

**Standard:** `C:/Users/Meng-Chieh/.claude/plugins/cache/egm/egm/0.1.1/resources/document_standards/zoom-out-standard.md`

**Context:** `C:\Projects\baobao\zoom_out_report.md` (Stage 5), `C:\Projects\baobao\comprehension_report.md` (Stage 6), `C:\Projects\baobao\critic_report.md` (Stage 7)

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-zoom-out` | completed |

**Severity breakdown:** 0 Blocker, 9 Major, 7 Nit

**Verdict:** Approve with changes. The architecture is still the right size for the project. The main risk now is the order of edits. Many Stage 6/7 proposals would add text for problems that either go away once the Stage 5 scope cuts are made, or that lines 300-633 already solve. Stage 7 reviewed only lines 1-299.

## Prioritized Findings (Blockers -> Major -> Nits)

### F1. Several Stage 7 findings are already solved in lines 300-633 - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Stage 7 M2 (part), M4, M9, M14, N11; doc lines 204, 316, 320-331, 349-368, 433, 462, 545, 559
* **Discrepancy Description**: The Detailed Plan already covers these items:
  * storage errors: line 462 wraps all `localStorage` access in try/catch
  * saving after a loss: line 559 saves when the Result screen opens, on both win and loss; only line 204 contradicts it
  * the economy: lines 349-368 list ingredients, drop rate, recipes and cost
  * determinism: line 433 uses a seeded RNG, and line 545 caps steps per frame
  * the numbers: lines 316 and 320-331 give the steam and cooldown values
* **Rationale & Recommendation**: Don't add new sections for these. Change line 204 to "進入結果畫面、抽獎、合成之後存檔". Make lines 111, 138-139 and 186-191 point to §0 instead of restating the rules.

### F2. The doc states the same rules twice, and the copies have drifted apart (missed by Stage 5) - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** §4-§8 (lines 133-205) vs. §0 and the item list (lines 302-368, 458-464, 553-559)
* **Discrepancy Description**: These rules appear in two places:
  * steam: lines 138 and 316
  * tickets: lines 162 and 344-359
  * recipe examples: lines 187-190 and 365-366
  * when to save: lines 204 and 559
  * save shape: lines 203 and 464

  Most contradictions found in Stages 6 and 7 are pairs whose copies drifted apart: Comprehension #2 and #4, Critic M4, M9 and M13.
* **Rationale & Recommendation**: Keep the rules in §4-§8 in plain words, with no numbers or examples. Make §0 the only place for numbers, tables and recipes. Fix each contradiction by deleting one copy, not by editing both.

### F3. Make the Stage 5 scope cuts before the Stage 6/7 wording fixes - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Stage 5 #5, #6, #7 and the later items they make unnecessary
* **Discrepancy Description**: Three Stage 5 cuts remove most of the later findings:
  * **#5, gacha without tickets:** removes M9's ticket half, N10, N14, Comprehension #2 and Nit 1, and Stage 5 #8.
  * **#6, fixed ingredient rewards:** removes M4, the drop part of M14, M9's drop and pickup questions, and the seed-source Nit.
  * **#7, no 6-bun cap:** removes M5, N19, the "first 6" Nit, and most of M8.
* **Rationale & Recommendation**: Settle #5, #6 and #7 first. Then apply only the Stage 6/7 items that still apply. Wording fixes made before the cuts would land on text that is about to be deleted.

### F4. The 2x textures don't make edges sharp, and the doc relies on them (missed by Stage 5) - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 36, 195, 496, 517; Stage 7 M7
* **Discrepancy Description**: The design uses a 960×540 canvas with `Scale.FIT`. Textures drawn at 2x are shrunk into that canvas, and then the browser stretches the canvas 2-3x, so edges still come out soft. This puts the main goal "畫面好看" at risk, and the 2x drawing step adds complexity without helping.
* **Rationale & Recommendation**: Choose one:
  * Size the canvas at 960×540 × min(devicePixelRatio, 2) and use `camera.setZoom`.
  * Drop the 2x step and accept soft edges.

  Check the result on her phone in the first build step (Stage 5 #3a). Don't build a separate HiDPI layer.

### F6. "Every level can be cleared with base buns only" is a scope rule - Severity: Major (raised from Stage 7 N15)
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Alternative F (line 250), lines 29-30, §5
* **Discrepancy Description**: Alternative F says the gacha and fusion screens are the first to cut if time runs out. That only works if no level needs a gacha or fusion bun. The doc never says this, and nothing tests it.
* **Rationale & Recommendation**: Add one line to Goals: every level can be cleared with the 5 base buns. Have the developer check it by playing each level with base buns only (see F8).

### F7. A full Risks & Mitigations table is too much for this project - Severity: Major (Stage 7 B1 rated it Blocker; kept but cut down)
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** new section; Stage 7 B1
* **Discrepancy Description**: B1 asks for 9 risks with Likelihood and Impact columns. That is too heavy for a 10-level gift game, and many of those risks are already handled elsewhere: save wipe, cut order, iOS audio (line 211) and the particle cap (line 286).
* **Rationale & Recommendation**: Add a short `## Risks` list of at most 5 one-line bullets, each marked "mitigated" or "accepted":
  1. iOS deletes storage after 7 days without a visit
  2. her phone model is unknown
  3. HiDPI sharpness (F4)
  4. difficulty is first judged late in the build
  5. the GitHub repo is public (Stage 7 N17)

  Leave out the Likelihood and Impact columns.

### F8. Build order: keep. Balance bot and gallery scene: drop. - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Stage 5 #3 (b) and (c); Stage 7 N16
* **Discrepancy Description**: A bot that plays tower defense needs its own placement strategy, which makes it a second project. Its results also say little about how the game feels to her. The art gallery scene repeats the preview page that Alternative E already rejected.
* **Rationale & Recommendation**:
  * Keep the build order (Stage 5 #3a).
  * Keep the dev-only `?level=N&unlockAll` parameter.
  * Replace the bot with a developer playtest of every level using base buns only. This also checks F6.
  * Drop the gallery scene.

### F10. Save robustness: merge with defaults, no migration chain - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 205, 461-462; Stage 5 #1, Stage 7 M3
* **Discrepancy Description**: Line 205 resets the save whenever the version number differs, so any later change to the save format erases her progress. A `migrations[v]` chain is more than a save of about 5 fields needs.
* **Rationale & Recommendation**: Load with `{...defaultSave(), ...parsed}` and reset only if parsing fails. Add one test: an old-format save keeps `cleared`. Remove `SAVE_VERSION`, or keep it for information only.

### F11. iOS storage deletion: a few lines of setup, not a feature - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 44, 383; Stage 5 #2, Stage 7 M2
* **Discrepancy Description**: Safari can delete `localStorage` after 7 days without a visit. A casual player could easily go a week without playing. The fix is small but easy to over-build.
* **Rationale & Recommendation**:
  * Add the `apple-mobile-web-app-capable` meta tag and a minimal `manifest.webmanifest`.
  * Call `navigator.storage.persist()` once.
  * Add the home-screen icon on her phone yourself, and tell her to open the game from there.

  Skip the Title-screen hint and the export code. If her progress is ever lost, `?unlockAll` can restore it.

### F5. Tap-target size needs one sentence, not a layout redesign - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** line 209; Stage 7 M8
* **Discrepancy Description**: On a landscape phone about 340 CSS px tall, the scale is about 0.63:

  | Element | Game px | CSS px |
  | --- | --- | --- |
  | Grid cell | 80 | about 50 |
  | Card | 96 | about 60 |
  | Minimum button (line 209) | 48 | about 30 |

  Cells and cards are big enough. Only the 48 px button minimum is too small.
* **Rationale & Recommendation**: Change line 209 to "按鈕至少 72 遊戲像素（最小手機上約 44 CSS 像素）". The layout doesn't need to change.

### F9. Alternatives: give reasons instead of adding options - Severity: Nit (Stage 7 B2 rated it Blocker and M1 Major)
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 214-280; Stage 7 B2, M1
* **Discrepancy Description**: "Rejected by author" is fine here because the author owns the doc. The real gap is that Alternatives A, E, F and I give no trade-off. Adding PixiJS, Canvas, Kaplay, SVG and TypeScript as alternatives (M1) would be padding.
* **Rationale & Recommendation**: Add one trade-off clause each to A, E, F and I, and use the same prefix format for every alternative, H included. Skip M1, or at most add a short reason to the Phaser row at line 90.

### F12. Audio: decide "not in v1" and remove the stub - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 55, 211, 519-521, 529; Stage 5 #10, Stage 7 M10
* **Discrepancy Description**: Stage 7 M10's §10 audio section would describe a feature the doc hasn't committed to.
* **Rationale & Recommendation**: Add "v1 沒有聲音" to Non-Goals. Delete `audio.js` (item 28) and the audio unlock code in the Title scene.

### F13. Drop the 2x game speed (missed by Stage 5) - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 316, 545, 549; Stage 5 #13
* **Discrepancy Description**: A 2x speed toggle is for experienced players, and an easy 10-level game doesn't need one. It is also the only reason the step-cap edge case matters.
* **Rationale & Recommendation**: Keep pause and remove 2x speed.

### F14. Keep the fix for the stat-only gacha buns small - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 174-175, 256; Comprehension #3, Stage 7 M6
* **Discrepancy Description**: Designing new behaviour for each gacha bun adds design and balancing work.
* **Rationale & Recommendation**: Reword Alternative G so the "different attack style" claim covers only the fusion buns. Optionally, change 辣椒刈包 to `clamp` + `splash`. That is a data-only change.

### F15. Skip the effect-by-enemy interaction matrix - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Stage 7 N9; Comprehension #5; line 340
* **Discrepancy Description**: A full matrix of how each effect part interacts with each enemy is more detail than the doc needs. The pigeon row at line 340 already covers most of it.
* **Rationale & Recommendation**: Add one sentence: every bun blocks ground enemies, `block` means high HP and no attack, and flying enemies pass every bun.

### F16. Generate the font in CI instead of adding a coverage test - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 391-393, 602-616; Stage 5 #4, #9
* **Discrepancy Description**: Stage 5 #4 adds a test that the committed font covers every character the game uses. Generating the font from the source removes the need for that test.
* **Rationale & Recommendation**:
  * Move the JSON data checks into Vitest.
  * Have `subset_font.py` scan the source for CJK characters directly.
  * Run it in CI before each build, after `pip install fonttools brotli`.

## Verdict Table: Stage 5/6/7 Proposals

| Proposal | Verdict | Reason |
| --- | --- | --- |
| S7 B1 Risks section | Trim | At most 5 one-line bullets, no Likelihood/Impact columns (F7) |
| S7 B2 Alternatives reasons | Trim | One trade-off clause each for A/E/F/I, one format (F9) |
| S7 M1 More engine alternatives | Skip | Padding; at most a short reason on the Phaser row |
| S5 #1 / S7 M3 Save version | Do (trim) | Merge with defaults, no migration chain (F10) |
| S5 #2 / S7 M2 iOS storage deletion | Do (trim) | Meta tag, manifest and `persist()`, set up on her phone in person (F11) |
| S7 M4 Save after a loss | Skip | Already handled at line 559; fix only line 204 (F1) |
| S7 M5 / N19 Loadout picker | Skip | Remove the 6-bun cap instead (S5 #7) |
| S5 #7 Remove the cap | Do | Removes the picker, the ordering rule and most of M8 |
| S7 M6 / Comp #3 Stat-only gacha buns | Trim | Reword Alt G; optional data-only change (F14) |
| S7 M7 HiDPI | Do | Real threat to "畫面好看" (F4) |
| S7 M8 Tap-target size | Trim | One sentence (F5) |
| S7 M9 Economy table | Skip | Already in §0, and mostly removed by S5 #5/#6 |
| S7 M10 Audio section | Skip | Add "no sound in v1" to Non-Goals instead (F12) |
| S7 M11/M12/M13/M15 Terminology | Do | Cheap wording fixes |
| S7 M14 Determinism | Trim | RNG and step cap already exist; reword line 111 |
| S5 #3a Build order | Do | Cheapest protection against running out of time |
| S5 #3b Balance bot | Skip | A second project; use a developer playtest instead (F8) |
| S5 #3c Dev URL param / gallery scene | Do / Skip | Keep the URL param; the gallery repeats rejected Alt E |
| S5 #4 Data checks in Vitest | Do | One fewer tool to run by hand |
| S5 #4 Font coverage check | Replace | Generate the font in CI instead (F16) |
| S5 #5 Gacha without tickets | Do | Largest simplification |
| S5 #6 Fixed ingredient rewards | Do | Removes random drops and farming |
| S7 N15 Base-only clearable | Do (raise) | Makes the cut plan workable (F6) |
| S7 N17 Public repo | Do (one line) | Accept it in Risks, or keep private jokes out of the repo |
| S7 N18 Back navigation between screens | Trim | One line: every screen has a back button |
| S7 N3/N4/N8 | Skip | Cosmetic conformance only |
| S7 N2/N6/N7/N10/N14 | Do | Trivial |
| Comp #1, #2, #4, #6 | Do | Wording fixes; #2 goes away under S5 #5 |
| Comp #5 / S7 N9 Interaction matrix | Trim | One sentence, no matrix (F15) |
| Comp Nits (win rule, clamp cooldown, font URL) | Do | One line each |
| Comp Nits (seed source, first-6 order, same ingredient twice) | Mostly removed | The first two go away under S5 #6/#7; same ingredient twice needs one line |
| (new) Drop 2x speed | Do | Not needed for an easy 10-level game (F13) |
| (new) Single source of truth for rules | Do | Main cause of the contradictions (F2) |

## Recommended Order

1. Apply the Stage 5 scope cuts (#5, #6, #7).
2. Put each rule in one place (F2).
3. Fix HiDPI sharpness (F4).
4. Add the base-buns-only clear rule (F6).
5. Apply the remaining one-line wording fixes from Stages 6/7, about a dozen.

Skip these: the Risks matrix, extra engine alternatives, the economy table, the loadout picker, the audio section, the migration chain and the balance bot.

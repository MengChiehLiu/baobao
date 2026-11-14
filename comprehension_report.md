# Stage 6: Comprehension Test

* **Target:** `docs/designs/baobao.md`. FeatureRange: lines 1–299; DetailedRange: lines 300–633.
* **Reviewer:** egm-comprehension. It read the document alone, with no other context.

## What this proposes

The document proposes **baobao**, a single-player web tower-defense game with 10 levels, built as a gift for the author's girlfriend. She places cute buns on a breakfast-shop field of 5 lanes by 9 cells to stop ants, mice, cockroaches and pigeons. The enemies walk from right to left toward the shop counter, and she loses if 3 of them reach it. Placing a bun costs "steam", which builds up during the battle.

Each bun type is a data record built from five shared "effect parts": `shoot`, `splash`, `puddle`, `clamp` and `block`. The five basic buns unlock as she clears levels. Five rare buns are obtained outside battles:
- **Gacha:** three buns, each costing one bun ticket (包子券) from first-time clears.
- **Steamer fusion:** two buns, made by combining two ingredients that enemies drop. A wrong recipe returns the ingredients.

The game is plain JavaScript on Phaser 3, bundled with Vite and hosted on GitHub Pages. All art is drawn in code when the game starts. The rules live in a pure-JS layer with a fixed time step and seeded randomness, separate from the Phaser screens. Tuning values are in JSON files, progress is saved in localStorage, and Python scripts check the data and shrink the font file.

## How the existing system works, per this document

There is no existing system. Every file in the plan is marked "Create", so this is a new project. The background the document gives instead:
- The developer writes mainly Python, has never made a game, and cannot draw.
- Existing tower-defense games don't suit her: their themes mean nothing to her, and many have paid gacha or stamina limits.
- The game must run in a phone browser with nothing to install.

I could paraphrase every section, so there are no Blockers.

## Findings

### Blocker
None.

### Major

**1. Who adds new content each level contradicts the level table**
- **Location:** line 29, line 177, lines 344–355.
- **Problem:** Line 29 says every level adds one new bun or enemy, and line 177 says at most one per level. The level table disagrees:
  - Levels 1 and 3 each add a bun and an enemy, which is two items.
  - Levels 4 and 8 add only ingredient drops, and level 10 adds nothing new.

  A reader cannot tell which one is the rule.
- **Fix:** Pick one rule, such as "at most one new bun and one new enemy; some levels only add drops", and make lines 29 and 177 match the table.

**2. Ticket rewards are inconsistent**
- **Location:** line 64 (CUJ 1), line 162, lines 344–355, line 359.
- **Problem:** Line 162 says every first clear gives 1 ticket. CUJ 1 says clearing level 1 shows the tickets she got. But the table gives tickets only for levels 2, 4 and 6, and line 359 depends on there being exactly 3 tickets.
- **Fix:** In the feature section, say "levels 2, 4 and 6 give 1 ticket on first clear (3 total, one per gacha bun)". Change CUJ 1 so clearing level 1 does not show a ticket.

**3. Rare buns contradict the stated reason for rejecting "stat-only" buns**
- **Location:** line 174, line 175, line 256, lines 327–331.
- **Problem:** Alternative G is rejected because the rare buns' oddness should come from different attack styles, not bigger numbers. But all 3 gacha buns are existing parts with different numbers. The chili gua bao is `clamp` with bigger numbers, not the "combination of two parts" that line 175 promises. Only 1 of the 5 rare buns actually behaves differently.
- **Fix:** Either give each rare bun a real behavioural difference (for example, chili gua bao = `clamp` + `splash`), or reword line 256 to say only fusion buns behave differently and gacha buns are stat variants.

**4. Recipe examples don't match the ingredient list**
- **Location:** line 187, line 190, line 365.
- **Problem:**
  - Line 187's example recipe is "cheese + liusha", but liusha is not one of the four ingredients.
  - Line 190's hint example "sticky + bursting" does not match the actual hint at line 365, "stringy + bursting".
  - The feature section never names the ingredients or the recipes.
- **Fix:** Use real ingredient names in line 187, quote the actual hint at line 190, and list the four ingredients in §4 or §6.

**5. What `block` does differently is unclear, and so is how pigeons move past buns**
- **Location:** line 152, line 155, line 158, line 340, line 582.
- **Problem:**
  - Line 155 says enemies stop and bite any bun they touch, so every bun already blocks. It is unclear what `block` adds beyond high HP.
  - The document never says whether a pigeon also flies over a char siu bao or a gua bao. The test at line 582 only covers mantou.
- **Fix:** State that blocking is a property of every bun and that `block` is just a high-HP part with no attack. Also state that flying enemies pass every bun.

**6. "The assistant" is never explained, and it changes the story of who writes the code**
- **Location:** line 232 (also lines 21 and 224).
- **Problem:** Alternative C says "the assistant" (助理) will write the code, but the term is never defined. Alternative B's argument assumes the Python-focused developer writes the code.
- **Fix:** Say in The Problem who implements the game, for example: "an AI coding assistant writes the code; the developer reviews it and tunes the JSON."

### Nit

- **Lines 64 and 70:** "Bun ticket" (包子券) and "ingredient" (食材) are used before they are defined. Add a one-line definition of each in the Overview or Goals.
- **Lines 64 and 162:** The win condition is stated two ways: "all enemies defeated" and "all waves finished". It is unclear whether she still wins if 1–2 enemies leak through.
- **Line 172 versus line 325:** It is unclear where the puddle forms, and what happens to a bullet that hits nothing.
- **Line 326:** Two different cooldowns appear in one row. The chili gua bao row gives no clamp cooldown at all.
- **Line 357:** The wave-size formula and `levels.json` can both define wave size. State which one wins.
- **Lines 111 and 433:** The document never says where production battles and gacha draws get their random seed.
- **Line 539:** "The first 6 unlocked buns" has no defined order.
- **Fusion screen:** It is not specified whether she can put the same ingredient in both slots.
- **Line 199:** "jf 粉圓體" (jf Open Huninn) has no link. Line 616 mentions GitHub but gives no URL.

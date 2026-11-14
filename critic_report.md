# Goldfish Review Report

**Target:** `C:\Projects\baobao\docs\designs\baobao.md` (`Lines 1-299`)
**Stage:** 7 (Critic Review), Mode: REVIEW
**Standard:** `resources/document_standards/feature-spec-standard.md` (egm-design, egm-structural). egm-style has no named default standard, so it applied the same standard, and only to wording and claim support.
**Context:** No codebase exists yet. The document is in Traditional Chinese, and quoted phrases are kept in the original.

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-design` | completed |
| `egm-structural` | completed |
| `egm-style` | completed |

**Severity breakdown after deduplication:** 2 Blocker, 15 Major, 20 Nit.

Severity notes: where reviewers disagreed, the synthesizer set the final level and recorded the original levels. One Nit (screen-flow return edges) was found during synthesizer verification and not by a reviewer.

---

## Prioritized Findings (Blockers -> Major -> Nits)

### B1. No Risks & Mitigations section - Severity: Blocker
* **Reviewer Lens:** `egm-structural`, `egm-design`
* **Affected Scope:** Whole range. Suggested location is after the Technical Plan or after Alternatives (around line 281).
* **Discrepancy Description**: The standard requires the spec to "identify potential failure modes, security implications, scalability limits, and how they will be mitigated." The document has no such section. Risks are scattered or not mentioned at all:
  * unknown phone platform (line 54)
  * save reset when the version changes (line 205)
  * difficulty only validated at the end (Alt K, line 280)
  * "cut these screens first" (line 250)
  * particle cap (line 286)
  * iOS storage eviction, HiDPI blur, public repo exposure (see M2, M7, N17)
* **Rationale & Recommendation**: Add `## Risks & Mitigations` as a table with Risk, Likelihood, Impact and Mitigation/Accepted columns. Cover at least these:
  * performance on an unknown or old phone
  * localStorage eviction or blocking (iOS ITP 7-day rule, private mode)
  * save wipe when the version changes
  * HiDPI rendering sharpness
  * font licence and subset size (jf 粉圓體)
  * iOS audio unlock
  * difficulty misjudged without an early playtest
  * scope overrun and its cut order
  * public GitHub Pages repo

### B2. Alternatives are rejected "by author" and several lack concrete trade-offs - Severity: Blocker
* **Reviewer Lens:** `egm-structural` (Blocker), `egm-design` (Major), `egm-style` (Major)
* **Affected Scope:** Lines 220, 226, 232, 238, 244, 250, 256, 268, 274, 280 (and 262 for format)
* **Discrepancy Description**: The Alternatives Rule requires concrete technical or scope trade-offs. It also forbids attributing a rejection to a person without a linked issue, discussion or PR. Every alternative except H begins with "Rejected by author:". Several rationales only restate the decision:
  * A, line 220: "她要的是塔防"
  * E, line 244: "美術直接在遊戲裡調整就好"
  * F, line 250: "兩種都要做"
  * I, line 268: "就是玩一下"

  Alt H (line 262) has no prefix, so the format is inconsistent. The English prefix also sits inside Chinese prose.
* **Rationale & Recommendation**: Drop the attribution prefix and use one format everywhere, for example "否決原因：", including H. Rewrite each rationale as a trade-off:
  * **E:** "A preview page is a second entry point to maintain. The Boot scene already renders every texture, so the iteration speed is the same. The risk is a late art redesign, mitigated by checking on the device early."
  * **F:** Name the cost (about one extra scene plus one data file) and why it is worth paying. Keep the existing cut-order sentence.
  * **I:** "The save is about 5 fields with little replay value. An export/sync UI would cost more than the loss it prevents."
  * **A:** State the scope cost: a codex, a recipe book and collectible assets.

  Severity note: the "author" is the document owner and not a third-party maintainer, so the attribution clause is arguably satisfied. The missing trade-offs alone still fail the rule, which is why this stays a Blocker.

---

### M1. Alternatives are missing for the main technology choice (other JavaScript engines or renderers) - Severity: Major
* **Reviewer Lens:** `egm-structural`, `egm-design`
* **Affected Scope:** Lines 88-94, 214-280
* **Discrepancy Description**: The table chooses Phaser 3, plain JavaScript, Vite, GitHub Pages and localStorage. Phaser is compared only with Python (pygame/pygbag) and Godot. Other viable JavaScript options are never evaluated: PixiJS with a hand-written loop, plain Canvas 2D, Kaplay/Kaboom, and SVG/DOM. TypeScript is dismissed in one clause (line 91).
* **Rationale & Recommendation**: Add at least one alternative that uses another JavaScript engine or renderer, with a concrete rejection reason. Either state the TypeScript trade-off explicitly or add it as an alternative.

### M2. iOS storage eviction makes save loss far more likely than "acceptable" implies - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Lines 44, 203-205; Alt I (264-268)
* **Discrepancy Description**: Safari's ITP clears `localStorage` for a site that hasn't been visited in 7 days, unless the site was added to the Home Screen. Private browsing never keeps the save. A one-week break would wipe all progress, tickets and unlocks, which undermines Goal line 29 ("可以玩完 10 關"). The Non-Goal decision was made without considering this specific failure. Storage access is also not guarded, so blocked or full storage could crash the game.
* **Rationale & Recommendation**: Document the eviction behaviour. Then do one of the following: add a one-line "Add to Home Screen" hint on the Title screen, call `navigator.storage.persist()`, or explicitly accept the risk. Wrap all `localStorage` access in try/catch so the game still runs without saving.

### M3. Any save-version mismatch wipes the save - Severity: Major
* **Reviewer Lens:** `egm-design` (wording also flagged by `egm-style`)
* **Affected Scope:** Line 205
* **Discrepancy Description**: Line 205 resets the save to a new one whenever the version differs. Alt K (276-280) plans post-release tuning, so a format change after release is likely. Such a change would erase her progress. The phrase "不讓遊戲壞掉" is also vague.
* **Rationale & Recommendation**: When loading an older save, fill missing fields with defaults and keep the known ones, or add small per-version migration functions. Reset only when the save cannot be parsed. Reword the sentence to "避免舊格式造成讀取錯誤".

### M4. Ingredients kept after a loss are never saved - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Lines 70, 163, 204
* **Discrepancy Description**: CUJ 2 and line 163 promise that ingredients from a lost round are kept. Line 204 saves only after a level clear, a gacha draw or a synthesis. If she loses and then closes the tab, those ingredients are lost.
* **Rationale & Recommendation**: Also save when the Result screen appears (win and loss), or whenever an ingredient is picked up.

### M5. No screen for choosing which buns to bring - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Line 140; screen flow at lines 118-129; CUJ 3 (line 76)
* **Discrepancy Description**: A level allows at most 6 bun types, but up to 10 exist (5 base, 3 gacha, 2 synthesis). No screen, CUJ or rule says how the 6 are chosen. The flow goes straight from LevelSelect to Battle. CUJ 3 says the new bun can then be brought "選關時", which implies a selection step that is never specified.
* **Rationale & Recommendation**: Choose one: add a loadout step between LevelSelect and Battle (with its own CUJ), define an automatic rule, or remove the cap if 10 cards fit on screen.

### M6. Gacha buns contradict the rejection of Alternative G - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Line 174 vs. lines 252-256 and Goal line 31
* **Discrepancy Description**: Alt G rejects "buns that differ only in numbers" because "奇葩感要來自攻擊方式不同". Yet the 3 gacha buns are defined as "現有零件，換數值和外觀", which is that same rejected pattern.
* **Rationale & Recommendation**: Either give each gacha bun its own combination or parameterisation of existing components (for example, `shoot`+`puddle` with a large radius, or a `block` that does `splash` when it dies), or narrow Alt G's rationale so it applies only to synthesis buns.

### M7. The 2x texture plan probably does not give sharp edges on HiDPI phones - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Line 195 (also 135)
* **Discrepancy Description**: Phaser 3 has no built-in HiDPI support. With a 960x540 game and `Scale.FIT`, the canvas has 960x540 backing pixels and the browser stretches it 2-3x. Textures drawn at 2x are shrunk into that small canvas, so sprites and web-font text will still look soft. This threatens Goal line 36 ("畫面好看").
* **Rationale & Recommendation**: Either size the canvas at base resolution times the device pixel ratio (capped, for example at 2) and use camera zoom, or accept the softness explicitly. Verify on her real phone early. This also weakens the rejection of Alt E, because there is no early on-device check.

### M8. Touch-target size is in game pixels, not screen pixels - Severity: Major
* **Reviewer Lens:** `egm-design` (Major), `egm-style` (Nit)
* **Affected Scope:** Line 209
* **Discrepancy Description**: "至少 48 像素" does not say which kind of pixel it means. In the 960x540 base, a landscape phone with about 340-390 CSS px of usable height scales 48 game px down to about 30-35 CSS px. That is below the usual 44 px minimum. The 5-lane grid plus the card bar inside 540 px is most at risk.
* **Rationale & Recommendation**: State the minimum in CSS or screen pixels on the smallest phone you target, and derive the cell and card sizes from it.

### M9. The ticket and ingredient economy is undefined - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** Lines 70, 80, 82, 162-163, 179-191
* **Discrepancy Description**: The following are not specified:
  * which ingredients exist ("流沙" at line 187 is also a bun name)
  * which enemies drop which ingredients, and at what rate
  * how many of each ingredient a recipe needs (CUJ 4 says only "足夠的食材")
  * whether a successful synthesis consumes the ingredients (line 191's "不會消耗包子" answers a question nobody asked)
  * whether pickup is automatic or by tap ("撿", line 70)

  First clears award 10 tickets, but only 3 draws are useful. CUJ 3's "抽到一種她還沒有的" cannot hold once all 3 gacha buns are owned, and the gacha behaviour in that state is undefined.
* **Rationale & Recommendation**: Add a short economy table: ingredient types, drop sources and rates, recipe costs, what success consumes, and gacha behaviour when everything is owned (button disabled, or surplus tickets converted to ingredients). Replace line 191 with something like "配方成功時消耗放入的兩種食材（各 N 個）。"

### M10. The audio plan is inconsistent - Severity: Major
* **Reviewer Lens:** `egm-structural`, `egm-style`
* **Affected Scope:** Line 55 vs. lines 211, 295
* **Discrepancy Description**: Open Questions says "技術計畫先預留音效的位置". No Technical Plan section covers audio; the only mention is the iOS unlock at line 211. Future Improvements (line 295) then lists sound effects as future work. A reader can't tell whether sound effects are in v1.
* **Rationale & Recommendation**: Either add `### 10. 聲音` to define the hook (for example, logic-layer events map to sound-effect triggers), or state that audio is out of v1 and add it to Non-Goals.

### M11. "格" means frame, tick and grid cell - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 37, 104, 111, 135, 139, 286
* **Discrepancy Description**: "每秒 60 格" (frame), "5 條車道 × 9 格" and "空格子" (cell), and "每一格的狀態與事件" (logic tick, which line 111 calls "步"). The performance target and the grid both depend on this word.
* **Rationale & Recommendation**: Use "幀/FPS" for frames, "步" for logic ticks (including the diagram label at line 104), and "格" only for grid cells.

### M12. One concept has five names - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 13, 32-34, 174-175, 183
* **Discrepancy Description**: The same group is called "奇葩包子", "稀有包子", "一般稀有包子", "最奇葩的包子" and "抽獎包子". It is unclear whether "稀有" and "奇葩" are the same set or one is a subset. Line 13 says "少數" while line 32 says exactly 5.
* **Rationale & Recommendation**: Define the terms once in Goals, for example 扭蛋包子 (3), 合成包子 (2) and the umbrella term 特殊包子, and use only those afterwards. Replace "少數" with "5 種".

### M13. Exactly one vs. at most one new element per level - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Line 29 vs. line 177
* **Discrepancy Description**: Goals says "每關加入一種新包子或新敵人" (exactly one). Line 177 says "每關最多加入一種" (at most one). Line 177 is also a level-design rule placed inside the bun list.
* **Rationale & Recommendation**: Choose one rule, word it the same way in both places, and move line 177 next to the level design or Goals.

### M14. Determinism claim conflicts with random drops - Severity: Major
* **Reviewer Lens:** `egm-style` (Major), `egm-design` (Nit)
* **Affected Scope:** Line 111 vs. line 163
* **Discrepancy Description**: "同樣的輸入永遠得到同樣的結果" is not true when ingredient drops are random ("有機率掉食材"). The fixed-step loop also has no cap on catch-up steps, so 30 fps devices risk a "spiral of death".
* **Rationale & Recommendation**: Inject a seeded random number generator into `logic/` as part of the input, or narrow the claim. Cap the number of steps per rendered frame.

### M15. Ambiguous "載入不超過 2 秒" in Goals - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Line 30 vs. lines 70, 287
* **Discrepancy Description**: The NFR allows 5 s for the first load, so "載入" at line 30 reads as a contradiction. CUJ 2 shows the 2 s is meant for restarting a level. "輸了一點就能重來" can also be read as "lose a little".
* **Rationale & Recommendation**: Rewrite as "輸了點一下「再試一次」，2 秒內重新開始同一關。"

---

### N1. Who writes the code is first mentioned inside an alternative - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Line 232 vs. line 21
* **Discrepancy Description**: "程式碼由助理寫" first appears in Alt C. The JavaScript choice and the rejection of Python depend on it, but The Problem never mentions it.
* **Rationale & Recommendation**: Add one sentence to The Problem stating that an AI assistant writes the code.

### N2. "Future Improvements" has the wrong heading level - Severity: Nit
* **Reviewer Lens:** `egm-structural` (Major), `egm-style` (Nit)
* **Affected Scope:** Line 292
* **Discrepancy Description**: It is an H3, which makes it a child of Non-Functional Requirements even though the `---` rule separates it.
* **Rationale & Recommendation**: Change it to `## Future Improvements`.

### N3. Heading names differ from the standard - Severity: Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Lines 17, 84
* **Discrepancy Description**: The document uses "The Problem" and "Technical Plan (Architecture)", while the standard uses "Problem Statement" and "Proposed Architecture".
* **Rationale & Recommendation**: Rename the headings, or add the standard's terms in parentheses.

### N4. Heading language is mixed - Severity: Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Lines 86-207
* **Discrepancy Description**: The H2s are English, the Technical Plan H3s are Chinese only, and the CUJ and Alternative H3s are bilingual.
* **Rationale & Recommendation**: Use one pattern throughout, for example `### 1. Tech Choices（技術選擇）`.

### N5. Open Questions placement and wording - Severity: Nit
* **Reviewer Lens:** `egm-structural`, `egm-style`, `egm-design`
* **Affected Scope:** Lines 52-56
* **Discrepancy Description**: The section refers ahead to "技術計畫第 4 節". Line 56 ("想改的話直接說") is not phrased as a question. The phone question (line 54) is unresolved even though the FPS and touch-size targets depend on it.
* **Rationale & Recommendation**: Move the section after the NFRs or link with an anchor to `#4-戰鬥規則`. Rephrase line 56 as "第 4 節的互動規則預設值是否接受？". Resolve the phone model, or name the weakest target device (for example, iPhone SE in Safari).

### N6. Bold labels run straight into lists - Severity: Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Lines 137-138, 154-155, 161-162, 181-182, 186-187
* **Discrepancy Description**: There is no blank line between a `**label：**` line and the list that follows. Stricter Markdown renderers may not start the list.
* **Rationale & Recommendation**: Add a blank line after each label.

### N7. The FPS target appears twice - Severity: Nit
* **Reviewer Lens:** `egm-structural`, `egm-style`
* **Affected Scope:** Lines 37, 286
* **Discrepancy Description**: The 60/30 FPS target appears in both Goals and the NFRs, so the two copies can drift apart. "流暢" is filler next to the numbers.
* **Rationale & Recommendation**: Keep the numbers only in the NFRs and reference them from Goals.

### N8. Horizontal rules are used inconsistently - Severity: Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Lines 282, 290, 298
* **Discrepancy Description**: Only some sections are separated by `---`, and the rule at line 298 ends the range with nothing after it.
* **Rationale & Recommendation**: Use rules only between major parts, or remove them.

### N9. Pigeon and `block` interactions are underspecified - Severity: Nit
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** Lines 35, 158
* **Discrepancy Description**: "飛過饅頭" and "不會被饅頭擋住" use a bun name where the mechanic is meant, and 黑糖饅頭 (line 174) may not block. The spec doesn't say whether pigeons bite other buns, can be clamped, or take ground `splash`.
* **Rationale & Recommendation**: Write "不會被 `block` 型包子擋住". Add a table of how each component interacts with each enemy type.

### N10. "包子券" is used before it is defined - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Line 64 vs. line 162
* **Discrepancy Description**: The term first appears in CUJ 1 but is only explained at line 162.
* **Rationale & Recommendation**: Define it in Goals line 32.

### N11. Exact and vague values side by side - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 138-139
* **Discrepancy Description**: "每 4 秒 +25" is exact, but the steam dropped by enemies and the "冷卻幾秒" cooldown are not given.
* **Rationale & Recommendation**: Give the numbers, or state that they are defined in JSON.

### N12. "蒸氣" means two things - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 15, 138, 198
* **Discrepancy Description**: The word names both the currency and a particle effect.
* **Rationale & Recommendation**: Rename the currency (for example "蒸氣值"), or note the double meaning as intentional.

### N13. Unquantified or overstated claims - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 90, 98, 225, 231, 237, 256
* **Discrepancy Description**: Several claims are unsupported or too strong:
  * Line 90: "手機瀏覽器上穩定" is unsupported.
  * Line 98: "畫面也可以隨意調整，不會改壞規則" promises more than the design can.
  * Line 225: pygbag size is not quantified, and the anti-aliasing claim ignores `pygame.gfxdraw`.
  * Line 231: "舊 iPhone" names no model.
  * Line 237: "找不到" and "每張風格都會不一樣" are absolute.
  * Line 256: "工作量差不多" is unsupported.
* **Rationale & Recommendation**: Narrow or quantify each claim, for example "調整畫面不需要改動規則層的程式碼", the pygbag download size, "預設繪圖有鋸齒", "舊型號（例如 iPhone 8 以前）", "不容易找到" and "風格難以統一".

### N14. Redundant and soft wording - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 32, 183, 287
* **Discrepancy Description**: Line 32's "（作者決定兩種都做）" repeats Alt F. Line 183's "不會抽到重複的" restates the first half of the sentence. Line 287's "應小於" is soft.
* **Rationale & Recommendation**: Delete the first two and write "小於 300 KB".

### N15. No stated balance assumption for base-only play - Severity: Nit
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Lines 29-30, 165-177
* **Discrepancy Description**: The spec doesn't say whether every level can be cleared with base buns only.
* **Rationale & Recommendation**: State that all 10 levels can be cleared with base buns, so gacha and synthesis never block progress.

### N16. Difficulty can't be checked until the end (Alt K) - Severity: Nit
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Lines 276-280 vs. Goal line 30
* **Discrepancy Description**: Rejecting the staged release removes every check before she plays the finished game.
* **Rationale & Recommendation**: Add an internal check, such as a self-playtest per level and a debug level-skip, so that late tuning stays JSON-only.

### N17. GitHub Pages exposes the source and personal content - Severity: Nit
* **Reviewer Lens:** `egm-design` (marked "could be Major")
* **Affected Scope:** Lines 93, 288, 296
* **Discrepancy Description**: Free GitHub Pages needs a public repo, so the private jokes planned at line 296 and the URL would be public. This sits awkwardly with the 隱私 NFR.
* **Rationale & Recommendation**: Either accept and state that the repo is public, or host from a private repo (for example Cloudflare Pages or Netlify).

### N18. Screen flow is missing return edges - Severity: Nit
* **Reviewer Lens:** synthesizer verification (not raised by a reviewer)
* **Affected Scope:** Lines 118-129
* **Discrepancy Description**: There are no edges from Gacha or Steamer back to Menu, from Result to Menu, or from LevelSelect back to Menu. An implementer can't tell how the player navigates back.
* **Rationale & Recommendation**: Add the back edges, or state that every screen has a back-to-Menu button.

### N19. Optional: add a loadout step to the flow - Severity: Nit
* **Reviewer Lens:** `egm-design` (derived from M5)
* **Affected Scope:** Lines 118-129
* **Discrepancy Description**: If M5 is solved with a loadout screen, the flow diagram needs a new node.
* **Rationale & Recommendation**: Update the diagram together with M5.

### N20. Alt H format - Severity: Nit
* **Reviewer Lens:** `egm-structural`, `egm-style`
* **Affected Scope:** Line 262
* **Discrepancy Description**: Alt H is the only alternative without the "Rejected by author:" prefix.
* **Rationale & Recommendation**: This is resolved by applying B2's single format to every alternative.

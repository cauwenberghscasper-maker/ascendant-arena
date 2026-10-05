# Ascendant Arena: mobile release assessment

Audit date: 5 October 2026. Source snapshot: `88a87d726bca422f4742535ee6c639eff237c00c` on `main`.

**Recommendation:** stabilize boss visibility, save recovery and resource ownership first. Then polish one complete mobile hero/equipment journey using the existing art. Validate gameplay enjoyment and performance before expanding content or introducing paid progression.

This is the baseline assessment at commit `88a87d7`. Subsequent authorized implementation and verification are recorded in [PHASE1.md](PHASE1.md); the baseline evidence and recommendations below remain a record of the original audit.

## 1. Repository, access and scope

- **Repository:** [cauwenberghscasper-maker/ascendant-arena](https://github.com/cauwenberghscasper-maker/ascendant-arena). Its owner matches the username you supplied; its README and source identify the game as Ascendant Arena.
- **Live game:** [Play Ascendant Arena](https://cauwenberghscasper-maker.github.io/ascendant-arena/). The page loaded and the game, menus and assets rendered.
- **Source access:** verified through GitHub and a local checkout. Local source edits are possible in this workspace.
- **Remote write access:** **now verified** through the newly available connection for `cauwenberghscasper-maker` (`cauwenberghs.casper@gmail.com`). Repository permissions report `pull: true`, `push: true`, `admin: true`. The initial audit used the older CasperCa2 connection, which lacked push permission; this access finding was updated after the correct connection became available. No push was attempted.
- **Instructions:** README reviewed. No tracked `AGENTS.md`, `CLAUDE.md` or related Claude documentation exists in this snapshot. README's Three.js single-page architecture and separate Supabase/Claude save paths match the source. Its server-side claims cannot be checked because the Supabase SQL/RPC definitions are absent.

The repository contains one approximately 875 KB / 8,844-line game file, a manifest, assets and three Python asset utilities. Review covered simulation, boss lifecycle, rendering, asset loading, input, UI, saves, multiplayer adapters, progression and asset tools. Every stored 3D model was inspected structurally and rendered in a separate read-only gallery. Browser checks covered the fresh-player lobby, menu, hero Stats/Gear and settings at desktop, 390×844, 320×568 and 844×390 CSS viewport sizes. These are desktop-browser viewport tests, **not physical-phone tests**. The live deployment's exact commit was not independently fingerprinted.

Evidence labels below: **Reproduced** = an isolated test executed current source; **Verified** = directly observed UI, file or code path; **Hypothesis** = plausible impact requiring further measurement or reproduction; **Proposal** = recommended future work.

## 2. Critical bugs and release blockers

| Priority | Finding and evidence | Impact / focused next action |
|---|---|---|
| First | **Reproduced: an existing golem view stays hidden after a showcase menu closes.** [Visibility suppression][visibility], [boss update][bossview]. | Combat continues against an invisible boss. Restore boss visibility in its update; retain menu suppression and retreat behavior. |
| First | **Reproduced: save sanitizer throws on `gear: null` or a null brawler entry.** [Sanitizer and Store][saves]. | A malformed local save is treated as no save; boot can create defaults. Validate nested data and preserve a recoverable copy before replacing anything. Actual user-save loss was not tested. |
| First | **Verified: owned generated materials are cloned but omitted from view disposal.** [Instance cloning][clones], [character disposal][character], [enemy disposal][enemy]. | Repeated loadout/scene changes can leave renderer resources allocated. Establish ownership and dispose per-instance materials; measure memory over repeated transitions. |
| Before public release | **Reproduced: `pointercancel` fires an aimed basic attack.** [Attack handler][input]. Super cancellation already handles this correctly. | An interrupted touch can consume/fire an attack unexpectedly. Clear gesture state without setting a shot on cancellation. |
| Before paid economy | **Verified: public settings contain currency, level, legendary gear and unlock grants.** [Testing tools][testing]. Saves, loot and idle time are client controlled. | Progression cannot support trusted purchases, competitive rewards or leaderboards yet. Separate development controls and implement server-validated paid entitlements/economy where needed. Hiding buttons alone does not make browser state authoritative. |
| Before public release | **Verified: public multiplayer cannot initialize without Claude services; Arena opponents are bots.** [MP initialization][multiplayer], [Arena creation][arena]. | “10-player battle” and “Finding 9 opponents…” imply online matchmaking that is absent. Label Arena as versus AI and replace the obsolete email/Share instructions. Decide later whether actual multiplayer is commercially necessary. |

### Invisible golem: lifecycle and cause

1. [Boss timer/spawn][spawn] creates a **new simulation entity**, registers it in `G.ents`, gives it HP and marks it alive. There is no recycled boss-entity pool in this path.
2. [View synchronization][visibility] creates a view keyed by that entity. [The boss builder][bossview] uses cached procedural geometry for seven zones: body, arms, glowing core, rune rings and shadow. It does **not** load a generated golem GLB.
3. The builder raises the model from the ground over roughly 1.25 seconds, swings arms, applies damage flash and pulses the core. The renderer updates these independently of [boss AI][bossai].
4. Opening a hero or Smith showcase calls `setShowcase(true)`. `syncViews` sets all existing non-player roots to `visible = false`, retains them in the `seen` set and skips their updates.
5. Closing restores the world/studio groups, but it does not restore the boss root. Fighter and enemy updates explicitly restore visibility; the boss update does not. The retained boss remains invisible while simulation resumes/continues with HP, tracking and damage intact. Bosses are exempt from the normal distance-cull branch, so that branch is not the explanation for this reproduction.
6. [End/despawn][bossend] clears `G.boss`, unregisters the entity and cancels owned pending area attacks. The next synchronization removes and disposes the view. Retreat uses a separate sinking transform. Cached geometry is shared intentionally; it must not be destroyed on every despawn.

**Evidence:** `audit/checks.cjs` executes the real boss builder and `syncViews` with minimal rendering doubles. The existing-view → showcase → close sequence leaves the boss hidden in **all seven zones**. An in-memory candidate change restores all seven and passes rise, retreat and view-removal checks. No game source was patched.

**Proposed focused change**, at the beginning of the boss view's `update`:

```js
root.visible = b.alive !== false;
```

This matches the existing view-owned visibility approach. Showcase still skips the update and hides the root. Do not change spawn timing, AI or boss assets as part of this fix.

**Regression acceptance:** all seven zones; opening/closing Hero, Gear and Smith before/during/after spawn; repeated tab switching; menu open when the entity first spawns; death, retreat, hub→Arena→hub and page background/resume. Confirm a visible model while HP/damage are active, and no model/owned pending area attacks after despawn. A boss first spawned while showcase is already open follows a different path because its view may not exist yet. This isolated reproduction explains a definite disappearance trigger, but **does not prove every reported disappearance has the same cause**. Full live-combat reproduction and GPU rendering validation remain outstanding.

### Save integrity and imported data

`Object.assign(d, p)` replaces nested defaults before validating them. Besides null crashes, partial `gear` objects cannot reliably obtain defaults from `d.gear`, because that object was overwritten. `Store.load` catches errors and returns null; boot uses a new profile. Keep the original bytes, distinguish missing/corrupt/unavailable saves, validate each item/tree/currency and offer recovery instead of silently treating corruption as a fresh player.

Backup codes are base64 JSON, not authenticated economy records. [Backup import][backup] feeds the sanitizer, while [item rows][itemrow] interpolate imported item names and IDs into HTML without escaping. **Verified code path; no exploit executed:** crafted imported strings can enter markup. Use text nodes/escaping for display data and an allowlisted profile schema. This matters to save safety even before monetization.

**Hypotheses to test:** delayed cloud load can replace level-one gear/currency changes because `localFresh` checks level, jobs and kills rather than a revision; forced saves can overlap; unloading can interrupt asynchronous cloud writes. [Cloud code][cloud] comments say the server rejects older saves, but the server implementation is unavailable. Test with deliberately delayed/reordered responses and conflicting device saves before assigning these impacts as confirmed bugs.

## 3. Visuals and assets

### Inventory and quality

| Category | Stored models | Assessment |
|---|---:|---|
| Heroes | 16 | Consistent chunky proportions and readable faces. Fantasy and modern outfits mix several themes; retain strong silhouettes while defining a shared material/palette language. |
| Enemies | 14 | Distinct silhouettes: slime, boar, spiders, crawler, warden, seraph, etc. Fireimp is very dark under the gallery's lighting; test separation from dark terrain. Gold/white enemies need threat cues beyond color. |
| Character weapons | 10 | Mostly recognizable and usable. Dax/Kiko weapons have considerably more triangles than several other weapons; evaluate on-screen benefit before decimation. |
| Equipment-specific mesh | 1 | Dragonsoul Focus, 5,811 triangles. Other equipment presentation is predominantly procedural geometry/icons. More generated gear could help, but coverage is the gap rather than evidence that every existing model is poor. |
| Golem bosses | Procedural, seven zones | Body/arms/core/runes reviewed in code. The invisible-model failure is lifecycle logic, not an absent downloaded asset. All seven final appearances were not visually exercised in combat. |

All **41 GLBs have zero animation clips and zero skins/skeletons**. Current movement relies on code-driven transforms/part pivots. The characters look substantially better in the neutral-light gallery than in their tiny pixelized menu representations. Higher mesh detail alone will not improve motion quality, combat readability or the lobby layout.

Measured catalogue totals: 528,772 triangles across all models; 19.32 MB model JSON versus 14.49 MB decoded GLB; 13.43 MB external model textures; 33.87 MB total assets. These are catalogue/on-disk totals, **not initial-download, GPU-memory or per-frame totals**. Base64 packaging adds approximately 4.83 MB before network compression; assets are lazy loaded.

### Separate asset problems from presentation problems

| Layer | Verified evidence | Proposal |
|---|---|---|
| Rendering | Pixel mode defaults on and quantizes/downscales the 3D world. [Pixel pass][pixel]. | Compare existing models in smooth 3D before buying replacements. Choose an intentional style; crisp UI and readable silhouettes matter more than maximum detail. |
| Equipment preview | Five equipment chips sit beside/over the hero, with another five-slot row in the Gear sheet. | Use one slot selector. Show the selected item at a useful size, hero fit preview and an explicit stat delta. Keep the hero unobscured. |
| Icons | [Thumbnail pipeline][icons] pixelizes item imagery to 32 pixels; the Python workflow deliberately targets retro icons. | Render matching 128/256-pixel icons from approved meshes, consistent angle/light/crop. Rarity should use frame, label and restrained accents. |
| Camera/scale | Hero showcase composition differs by orientation and competes with the scroll panel. [Showcase camera][camera]. | Normalize bounds, pivot and hero framing; reserve a fixed preview region in portrait. Inspect weapon grip and helmet clipping at several angles. |
| Materials/light | Model materials, procedural vertex colors, toon terrain, rim light and outlines use different conventions. | Define steel/leather/cloth/crystal presets and consistent exposure. Keep softer terrain and stronger subject contrast; constrain glow to important gameplay signals. |
| Animation | Static generated meshes, procedural walking/attack transforms. | Polish anticipation, impact and recovery for the starter hero and golem first. Rigging/retargeting is a separate production task; image-to-3D output is not an animated character deliverable. |
| Effects | Instanced projectiles/particles, pooled sprite effects, synthesized audio and reduced-flashing option already exist. | Preserve pooling. Standardize enemy telegraphs, player attacks and reward effects; maintain threat visibility under overlapping effects. Test reduced flashing and lower graphics in actual combat. |

**Proposed art direction:** polished stylized 3D with the current large-head silhouettes, clean sculpted shapes, controlled saturation and warm focal lighting. Use deep blue/slate UI surfaces, one restrained gold accent, readable sans-serif body text and consistent icon composition. Keep detail broad enough to read at phone size. Existing models form a usable starting point. Replace individual assets only after comparison under the same camera and lighting demonstrates a gain.

Starting pilot budgets, subject to profiling: equipment 2k–6k triangles, one material where possible, 512-pixel textures and 256-pixel UI renders; a larger hero budget can be retained if measured performance supports it. These are proposed production targets, not established device limits. Include pivots, physical scale, texture color spaces, simplified collision bounds, naming, provenance, licenses and reproducible export commands in an asset manifest.

## 4. Code health and performance

There is useful engineering here: fixed simulation steps with a catch-up limit, reusable projectile/particle pools, instanced world props, bounded DOM tag/damage-number pools, a static obstacle grid, fallback procedural models and cached HUD text. Preserve these while isolating fragile ownership boundaries.

| Priority | Concrete finding | Targeted improvement and check |
|---|---|---|
| First | [Cloned model materials][clones] are not released by character/enemy view disposal; player view rebuilds on equipment signature changes. | Track instance-owned materials and dynamically allocated geometry. Dispose those exactly once, retaining shared textures/geometry. After warm-up, 100 gear/scene cycles should reach a stable resource plateau. Actual leak magnitude is unmeasured. |
| Next | [Adaptive quality][quality] reduces `Q.dpr`, but default pixel-mode resize uses device DPR and its own fixed targets, ignoring `Q.dpr`. | Make the quality policy change the active render target. Test actual canvas/target dimensions and frame cost in both modes; the displayed render scale must reflect reality. |
| Next | Pixel mode renders the world then a screen quad. HUD reads renderer draw calls after these renders without changing `info.autoReset`. | Aggregate all passes once per frame. The sampled “1 calls” is the final quad, not the whole scene. Three.js documents [per-render reset behavior](https://threejs.org/docs/pages/WebGLRenderer.html). |
| Next | [Asset loader][loader] fetches JSON, decodes base64 and parses on demand; failure state is sticky, with no explicit retry/cancellation policy. | Add bounded concurrency, retryable transient failures and time/bytes/error instrumentation. Consider binary GLB packaging and preloading only the next required assets after measurements. Check interruption, first encounter and slow-network fallback. |
| Measure first | Projectile collision/homing scans targets; all hub enemies step even when distant. [Target traversal][targets], [hub step][hubstep]. | Measure projectile/AI CPU time at representative density. Introduce a dynamic spatial index or distant simulation tiers only if profiles justify it; current static obstacle indexing is already useful. |
| Next | `bodyGearCache` evicts merged geometry by deleting its key, without resource retirement. [Gear cache][gearcache]. | Document whether active views still share evicted geometry; release it only once unused. Use reference counts or another explicit ownership policy. |
| Next | Old branches remain after `heroTab` redirects Attacks/Skills/Road; legacy UI/state coexists with newer menu flows. [Hero tabs][herotab]. | Remove unreachable branches after journey checks, then extract saves, view lifecycle and UI into native modules with stable interfaces. Keep GitHub Pages deployment straightforward. |
| Next | Source references missing `tools/build_manifest.py`; no mesh-generation/export pipeline, pinned Python requirements, tests or CI are tracked. | Recover/document export steps and manifest generation. Add the focused regressions and a lightweight static deployment check rather than introducing a large framework. |

Tools reviewed: `item_prompts.py` proposes 120 retro item concepts; do not batch-generate them before art direction is chosen. `pixelize_items.py` removes a flat background, downsamples and rewrites icon registrations; it discards input alpha and can lose fine silhouette details, so it should not automatically process premium transparent renders. `bake_fx.py` provides reproducible sprite-sheet generation and can be retained.

**Performance evidence limits:** a desktop browser at 390×844 displayed approximately 165 FPS, with the misleading one-call counter described above. No reliable CPU/GPU trace, battery/thermal measurement, mobile RAM baseline, initial network waterfall or input latency was collected. This is not proof of mobile performance. Instrument startup/decode/parse/first-render timings, per-system frame times, all render passes and renderer memory; profile a midrange Android and an older supported iPhone during a 20-minute combat/session test.

## 5. Mobile navigation, readability and journeys

**Verified:** the fresh-player menu exposes ten large tiles: Hero, Brawlers, Skill trees, Artifacts, Progress, Cases, Idle, Players, Smith and Showdown. At 320×568, two-column tiles were approximately 136×180–194 CSS pixels, and later actions were below the fold. Hero→Gear works, but duplicate slot controls and tiny labels reduce scan clarity. The fresh inventory had no alternative equipment, so actual equip/upgrade/salvage outcomes were reviewed in code rather than exercised with a progressed profile.

Measured controls: Hero Menu button 34 pixels high; Stats/Gear and Close 40; equipment chips 40; compact HUD controls 42×42; coach close 30×30. Upgrade was 46 high and combat buttons substantially larger. Use at least 44×44 CSS-pixel hit regions in the web prototype, then validate native point sizes and actual touch behavior. Apple recommends [44×44-point hit regions](https://developer.apple.com/design/human-interface-guidelines/buttons); this comparison is a design target, not a physical-device measurement. Safe-area CSS and scroll-panel `touch-action: pan-y` exist. Notch/home-indicator, browser toolbar and installed-app behavior remain untested. No document-width overflow was measured in the landscape Gear check.

**Proposed information architecture:** primary navigation **Play / Hero / Progress**, plus a small settings entry. Hero contains Characters, Equipment, Skills and Artifacts; upgrades/forging live beside the selected equipment. Progress contains Level Road and Rewards. Rename Cases to Treasure, Idle to Offline Rewards, and Showdown to Arena versus AI. Hide or clearly disable online Players until it works. Give each screen one obvious next action and preserve the selected slot/scroll position when returning.

**First-session design:** move → aim/auto-aim → dash a clearly telegraphed threat → earn one useful drop → compare/equip → see a visible power change → return to play. The current Coach includes those combat basics, but with NPCs off by default it skips job/NPC guidance; the first meaningful upgrade and return-to-play journey should be explicit. Explain gems, gold and mastery when first needed, rather than exposing their complete systems immediately.

**Journey acceptance:** at 320×568 and 390×844, find Play and Equipment without exploratory scrolling; compare an item using numeric deltas and perk explanation; equip and return to combat in no more than three actions from the item; preserve selection; show distinct feedback for incoming hits, dodges, immunity, pickup and reward. Test multi-touch movement plus aim, interruption, portrait/landscape, low graphics, reduced flashing and background/resume on physical devices. Keep damage numbers and boss telegraphs legible without depending only on rarity colors.

### Relevant successful-game patterns: researched, not app-tested

- **Brawl Stars:** Supercell's [Trophy Road redesign](https://supercell.com/en/games/brawlstars/blog/game-updates/release-notes-june-2025/) connects visual worlds, progress and reward milestones. Apply that principle to one clearly visible next milestone and reward here. This is a fit inference; it does not justify copying the breadth of its systems.
- **Survivor.io:** the publisher's [current store listing](https://play.google.com/store/apps/details?id=com.dxx.firenow) emphasizes one-hand controls and combined roguelite skills. Apply low-friction movement/auto-aim and readable build choices; test against the game's existing two-thumb aiming instead of replacing it by assumption.
- **Archero:** the publisher's [store description](https://apps.apple.com/us/app/archero/id1453651052) links replayable encounters, skill combinations and equipment progression. Apply a clear fight→reward→upgrade→retry journey with before/after feedback. Do not import its mature economy or numerous late-game systems into the first session.

These are current primary publisher/store sources checked during the audit; the Brawl Stars article documents a 2025 redesign. Competitor interfaces were not hands-on tested and their revenue/retention data were not verified. Pattern fit remains a playtest hypothesis.

## 6. Hugging Face connection and a costed pilot

**Connection verified:** Hugging Face authenticated as [Casper565](https://huggingface.co/Casper565), Pro account. The available connector supports discovery and compute jobs but exposes **no credit-balance operation**. The reported approximately $12 balance and remaining daily quota could not be verified. No job, generation, replacement or paid compute was launched.

| Candidate | Useful output | Availability / limitation |
|---|---|---|
| [Z-Image-Turbo](https://huggingface.co/Tongyi-MAI/Z-Image-Turbo) | Equipment concepts and UI imagery; Apache-2.0 model license. | Official [Space](https://huggingface.co/spaces/Tongyi-MAI/Z-Image-Turbo) exists; model card lists an inference provider. It does not output production 3D meshes. |
| [TRELLIS.2-4B](https://huggingface.co/microsoft/TRELLIS.2-4B) | Single-image→mesh with PBR materials; MIT. | Official [Space](https://huggingface.co/spaces/microsoft/TRELLIS.2) exists, but the model card reports no HF Inference Provider deployment. Mesh cleanup, optimization, pivots and rigging remain separate. |

The current asset pipeline already names these two models. Their suitability is stronger for **static equipment** than automatically rigged characters. Official Space metadata was retrieved, but generation health, hardware mode, queue and output quality were not tested. Existing meshes were rendered successfully; this does not validate future generation quality.

Verified pricing: Pro has **40 minutes of included daily ZeroGPU quota**; beyond it, eligible ZeroGPU Spaces consume prepaid credit at **$1 per 10 minutes of GPU time**. Full-size `xlarge` consumes twice the quota. See [HF ZeroGPU quotas and billing](https://huggingface.co/docs/hub/en/spaces-zerogpu). HF [Inference Providers pricing](https://huggingface.co/docs/inference-providers/pricing) is a different route; do not assume a Space, GPU job, direct provider account and monthly inference allowance share identical billing. Per-image/per-mesh prices were not verified.

**Proposed pilot, after your review:** a sword, helmet and amulet in one coherent material family; up to three concepts per item, then at most two mesh candidates per item. Produce matching icons from the approved meshes using local rendering. Compare them in a local branch against the current equipment with the same camera/light. Do not integrate all outputs automatically.

| Allocation | Assumed chargeable quota-equivalent time | Cost after free quota, at the verified ZeroGPU rate |
|---|---:|---:|
| Up to 9 concept images | 6.75 minutes | $0.675 |
| Up to 6 mesh candidates | 15 minutes | $1.50 |
| Export/retry contingency | 8.25 minutes | $0.825 |
| **Hard pilot ceiling** | **30 quota-equivalent minutes** | **$3.00 maximum target** |

These runtime allocations are **planning assumptions, not observed job runtimes or guaranteed unit prices**. Count `xlarge` at double usage. Free quota could reduce incremental cost to zero; its remaining balance is unknown. Before running anything, inspect billing and the actual selected Space's hardware/rate, confirm that the credit applies, and enforce the cap. If that cannot be done, pause the pilot rather than launching an unpriced GPU job. If $12 is confirmed and the $3 pilot route applies, retain at least $9. This generation budget excludes artist cleanup, rigging and development labor.

**Pilot acceptance:** all three items readable at actual icon size; consistent silhouette/material style; correct pivot and attachment; no obvious holes or clipping; mobile budget met; provenance/export metadata recorded; paired comparison preferred by at least 4 of 5 exploratory testers. That small test selects a direction; it does not establish market demand.

## 7. Commercial readiness

**Verified foundation:** combat, loot, equipment upgrades, mastery, skill trees, a progression road, arena bots, rifts, cases, pity counters, offline rewards and expeditions already exist. There is sufficient system breadth to test a compelling loop. Reliability and clarity currently undermine it. Public multiplayer promises and test grants also undermine progression trust.

**Unverified:** whether aiming feels responsive on phones, whether the first ten minutes are fun, where players quit, time-to-upgrade, difficulty fairness, repeat-session enjoyment and willingness to pay. There is no tracked analytics/payment integration found in this source; local `ev()` events drive game presentation and are not an external analytics pipeline.

Run 8–12 observed novice playtests first. Measure whether players understand a near-term goal, aim/dash deliberately, find equipment and explain why an upgrade helped. Then a small consented closed alpha can measure tutorial completion, time to first meaningful reward, first-session exits, D1/D7 return, replay rate, deaths by source, equipment conversion and session-length distribution. Record cohorts and uncertainty; a tiny sample cannot establish retention or revenue potential.

Proposed events: session_start/end, tutorial_step, mode_start/end, death with source, boss_spawn/view_hidden/end, loot_gain, equipment_compare/equip/upgrade, save_failure/recovery, asset_failure and performance tier. Include build/version, session ID and coarse device/quality class; avoid collecting save secrets or unnecessary personal data. Use these to locate friction before changing progression values.

**Fair monetization candidates to test later:** cosmetic hero/weapon skins and a clearly priced supporter pack that preserves combat fairness. Optional rewarded ads could be evaluated after the core loop works, with no forced interruptions or punitive reward balance. A season pass requires a sustainable content cadence and is premature now. Keep earned treasure/pity systems understandable; do not turn them into paid random rewards as the first experiment.

Before charging: reliable recovery across devices, trusted entitlement validation and purchase restoration, stable performance, understandable offers and tested economy boundaries. Review distribution/store requirements at that stage. Revenue viability requires measured retention and contribution margin: net receipts after platform/payment costs, acquisition, backend and content costs. No revenue prediction is justified by this audit.

## 8. Phased roadmap and acceptance criteria

| Phase | Deliverable | Exit criteria |
|---|---|---|
| **1. Reliability and measurement** | Focused boss/input/save fixes; model-resource ownership; production test-control separation; honest AI/offline copy; accurate render metrics. | Seven-zone visibility checks plus actual combat pass; cancelled gestures never fire; valid old saves migrate and malformed saves remain recoverable; no silent reset; warmed-up resources plateau through 100 gear/scene cycles; measured render dimensions/counters work in both styles. |
| **2. One premium mobile journey** | Starter hero, lobby/equipment layout, consistent icons/materials and one complete reward→equip→play flow using existing assets first. | No clipping/overlap at small portrait/landscape viewports; common hit targets meet the chosen minimum; novice testers complete the flow; physical notch/home indicator and multi-touch checks pass. Choose art direction before pilot. |
| **3. Asset pilot and performance hardening** | Approved three-item pilot; reproducible binary export pipeline; profile-driven loading/AI/VFX improvements. | Pilot stays within verified cap; mesh/icon acceptance passes; startup and frame budgets met on named devices; 20-minute sessions have no crashes or sustained resource growth. Proposed goals: 60 FPS on chosen midrange target, stable 30 FPS fallback, measured p95 frame time and thermal behavior. Final budgets depend on the baseline. |
| **4. Closed alpha and economy validation** | Onboarding/progression tuning, analytics and recovery testing; distribution decision. | Core journeys and saves reliable, major exit causes addressed, measured repeat-play evidence; no unexplained rewards/entitlement loss. Set retention and acquisition go/no-go thresholds before the cohort starts, using actual economics. |
| **5. Monetization experiment / expansion** | One optional cosmetic/support offer and measured pricing test; additional content only after earlier gates. | Restorable validated purchases, no competitive power advantage, clear offer comprehension and evidence that monetization does not damage retention. Expand systems based on observed demand. |

### Concrete first development phase for review

Prepare one reviewable local change set: restore boss visibility; correct touch cancellation; validate/recover nested saves; release instance-owned model materials and retire geometry safely; move development grants behind an explicit development configuration; label Arena as AI and remove obsolete public multiplayer instructions; correct the performance counter and adaptive pixel resolution. Add targeted regressions, a transition soak procedure and a physical-device test sheet. Extract only the save/view-lifecycle boundaries needed to support those changes. Keep asset generation and new gameplay content for later phases.

The isolated harness is supporting evidence, not a substitute for browser/GPU/device regressions. GitHub write access is now verified through the correct account connection, so a future reviewed change set can be pushed using that connection. No implementation or generation is included in this audit.

## 9. What could not be tested

- Actual iOS/Android touch latency, thermal/battery behavior, notches, installed-app chrome or RAM limits.
- Full boss combat reproduction, every procedural boss appearance, every attack/effect combination and all progressed inventory journeys.
- Supabase RPC authorization, schema, timestamp rejection, device recovery guarantees or multi-device conflict policy.
- Actual multiplayer across accounts; public code already lacks its Claude host services.
- Cold-load network totals, GPU traces, real device frame budgets and quantified leak growth.
- HF credit balance, remaining quota, selected Space hardware/health, generation pricing per request and mesh cleanup time.
- Native/store packaging, offline startup and payment restoration. A web manifest exists; no service worker is tracked or registered, so offline relaunch is not established.
- Competitor hands-on usability, user retention, acquisition cost, willingness to pay and revenue.

## 10. Evidence and repeatability

Local audit artifacts are in this repository's `audit` directory. `checks.cjs` extracts current source and runs boss/save/input checks; `evidence.json` contains all results and the complete asset inventory. `gallery.html` is a standalone read-only viewer for the existing models; serve the repository root with a local HTTP server and open `/audit/gallery.html`. It requires the same pinned Three.js CDN as the game.

Run `node audit/checks.cjs --baseline` to reproduce the original bugs and candidate fixes from commit `88a87d7`. Run `node audit/checks.cjs` for the repaired source and `node tools/check_release.cjs` for merge, progression, rendering and syntax checks. This assessment predates implementation; see [PHASE1.md](PHASE1.md) for the current change set and remaining release checks. No paid generation has been launched.

[visibility]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L6079
[bossview]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L5022
[spawn]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L3460
[bossai]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L3482
[bossend]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L3516
[saves]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L1658
[clones]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L4214
[character]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L4785
[enemy]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L4992
[input]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L6471
[testing]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L7149
[multiplayer]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L8243
[arena]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L3564
[backup]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L7128
[itemrow]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L6843
[cloud]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L8714
[pixel]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L6234
[icons]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L4594
[camera]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L6141
[quality]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L6209
[loader]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L4143
[targets]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L2030
[hubstep]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L3220
[gearcache]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L4598
[herotab]: https://github.com/cauwenberghscasper-maker/ascendant-arena/blob/88a87d726bca422f4742535ee6c639eff237c00c/index.html#L6948

# EnhancedQuickbuy-Tweaked

A personal customization of the **Enhanced Quickbuy** mod for Deadlock, packaged as a single VPK in 1-, 2-, and 3-item HUD versions. Includes compatibility support for **4x3 Fixes [bytenode ver.] 1.0.3**.

[Review and verification notes](REVIEW.txt)

## Downloads: choose how many HUD items to show

| Queued items beside the item slots | File |
| --- | --- |
| 1 (next item only) | [pak07_dir.vpk](pak07_dir.vpk) |
| 2 (next item + 1 preview) | [variants/2-items/pak07_dir.vpk](variants/2-items/pak07_dir.vpk) |
| 3 (next item + 2 previews, like the original mod's default) | [variants/3-items/pak07_dir.vpk](variants/3-items/pak07_dir.vpk) |

All three have the same filename. Install exactly one. Each version is identical except for how many items appear on the gameplay HUD.

The unmodified original mod is kept in [original/pak04_dir.vpk](original/pak04_dir.vpk) for reference. Do not install it alongside any of these files.

## What changed

- **One, two, or three items on the gameplay HUD.** The next queued item and its soul amount always appear beside the item slots. The 2- and 3-item versions also show the following queued items with the original mod's preview icons and soul amounts. The count number and its blue corner patch over the next item are hidden in every version. The next item's position, soul counter, and ready-to-buy border/glow are retained.
- **Simpler queue prices.** Item rows show their normal soul icon and price, without the added slash and cumulative amount.
- **Total Cost at the top of the shop queue.** The original top box shows the full-queue total and remains visible at `0` when the queue is empty. There is no footer cost box or duplicate next-item amount in the shop.
- **Separate quickbuy styles.** This build removes the shared stylesheet path that conflicted with the supplied 4:3 HUD. It also aligns the shop header and queue at 4:3. Existing positioning rules for other aspect ratios are retained.

## How pricing works

```text
Gameplay HUD amount = max(0, next purchase price − current souls − estimated queued-sale proceeds)
```

The purchase price comes from the game's displayed queue price, so owned-component discounts depend on that native value. The mod does not apply a second inventory discount.

In the 2- and 3-item versions, each extra preview shows the original mod's cumulative amount. This is the souls still needed to buy everything up to and including that item:

```text
Preview amount = max(0, sum of queued prices through that item − current souls − estimated queued-sale proceeds)
```

An upgrade queued after one of its components is counted at the reduced price, as in the Total Cost box. For example, with 300 souls and a queue of 800, 500, and 1250 souls, the HUD shows 500, 1000, and 2250.

Queued-sale proceeds use the original mod's estimate: half of each queued sale item's displayed price, rounded down and counted once. This is an estimate, not a prediction of full-refund windows.

The top **Total Cost** box retains the original queue-total calculation, including upgrade handling and sale credits. Current held souls do not reduce that total.

## Optional Universal Mod Manager settings

- **Total queue cost in shop** controls the top Total Cost box and defaults to enabled. Its saved toggle value is retained.
- The obsolete **Souls needed in shop** option is removed. Its legacy saved value cannot hide the Total Cost box or change the gameplay HUD amount.
- **Items shown** remains in the settings. The file you choose sets the maximum number of HUD items. In the 2- and 3-item versions, the slider can lower that number but cannot raise it. The default of 3 shows the full count for either version. The 1-item version ignores the slider.

## Using the 4:3 HUD

Keep the companion HUD's `pak48_dir.vpk` installed and replace only the previous Enhanced Quickbuy VPK with one of the `pak07_dir.vpk` files above. Load only one Enhanced Quickbuy version at a time. The companion's resources are not bundled in this package. The extra previews in the 2- and 3-item versions are wider than the 1-item HUD and have not yet been checked in-game at 4:3.

The [test checklist](4x3-test-instructions.txt) covers the shop and gameplay HUD at 1280×960 and provides a quick pricing check for future changes.

The companion inspected was [4x3 Fixes by bytenode](https://gamebanana.com/mods/693388), version 1.0.3, from the supplied ZIP. Other HUD mods can replace additional quickbuy files and may still need separate compatibility work.

## Verification status

The current package passed archive integrity checks, Source 2 Viewer verification/decompilation, and **30 mocked integration tests**. There are no duplicate resource paths between this package's five resources and the supplied companion's 18 resources; their combined resource map is identical in either archive order. These checks cover calculations, refresh behavior, panel structure, and selected CSS rules; they do not render Deadlock.

The maintainer reported this compatibility build **working in-game on 2026-10-24** after testing. That confirmation is separate from the local automated checks and does not establish support for every resolution or HUD mod. See [REVIEW.txt](REVIEW.txt) for the artifact hash and verification details.

The 2- and 3-item versions change only one stylesheet rule in that tested build. Their other four resources are byte-identical to the 1-item version. They passed archive and resource-structure checks, plus 672 mocked HUD-visibility scenarios. They **have not been tested in-game yet**.

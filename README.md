# EnhancedQuickbuy-Tweaked

A personal customization of the **Enhanced Quickbuy** mod for Deadlock, packaged as a single VPK. Includes compatibility support for **4x3 Fixes [bytenode ver.] 1.0.3**.

[Download the VPK](pak07_dir.vpk) · [Review and verification notes](REVIEW.txt)

## What changed

- **One item on the gameplay HUD.** Only the next queued item and its soul amount appear beside the item slots. Extra previews, the count number, and its blue corner patch are hidden. The next item's position, soul counter, and ready-to-buy border/glow are retained.
- **Simpler queue prices.** Item rows show their normal soul icon and price, without the added slash and cumulative amount.
- **Total Cost at the top of the shop queue.** The original top box shows the full-queue total and remains visible at `0` when the queue is empty. There is no footer cost box or duplicate next-item amount in the shop.
- **Separate quickbuy styles.** This build removes the shared stylesheet path that conflicted with the supplied 4:3 HUD. It also aligns the shop header and queue at 4:3. Existing positioning rules for other aspect ratios are retained.

## How pricing works

```text
Gameplay HUD amount = max(0, next purchase price − current souls − estimated queued-sale proceeds)
```

The purchase price comes from the game's displayed queue price, so owned-component discounts depend on that native value. The mod does not apply a second inventory discount.

Queued-sale proceeds use the original mod's estimate: half of each queued sale item's displayed price, rounded down and counted once. This is an estimate, not a prediction of full-refund windows.

The top **Total Cost** box retains the original queue-total calculation, including upgrade handling and sale credits. Current held souls do not reduce that total.

## Optional Universal Mod Manager settings

- **Total queue cost in shop** controls the top Total Cost box and defaults to enabled. Its saved toggle value is retained.
- The obsolete **Souls needed in shop** option is removed. Its legacy saved value cannot hide the Total Cost box or change the gameplay HUD amount.
- **Items shown** remains in the settings, but this build always hides extra HUD previews, regardless of its saved value.

## Using the 4:3 HUD

Keep the companion HUD's `pak48_dir.vpk` installed and replace only the previous Enhanced Quickbuy VPK with this `pak07_dir.vpk`. Load only one Enhanced Quickbuy version at a time. The companion's resources are not bundled in this package.

The [test checklist](4x3-test-instructions.txt) covers the shop and gameplay HUD at 1280×960 and provides a quick pricing check for future changes.

The companion inspected was [4x3 Fixes by bytenode](https://gamebanana.com/mods/693388), version 1.0.3, from the supplied ZIP. Other HUD mods can replace additional quickbuy files and may still need separate compatibility work.

## Verification status

The current package passed archive integrity checks, Source 2 Viewer verification/decompilation, and **30 mocked integration tests**. There are no duplicate resource paths between this package's five resources and the supplied companion's 18 resources; their combined resource map is identical in either archive order. These checks cover calculations, refresh behavior, panel structure, and selected CSS rules; they do not render Deadlock.

The maintainer reported this compatibility build **working in-game on 2026-10-24** after testing. That confirmation is separate from the local automated checks and does not establish support for every resolution or HUD mod. See [REVIEW.txt](REVIEW.txt) for the artifact hash and verification details.

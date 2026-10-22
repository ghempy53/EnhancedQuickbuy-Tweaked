# EnhancedQuickbuy-Tweaked

A personal customization of the **Enhanced Quickbuy** mod for Deadlock, packaged as a single VPK.

[Download the VPK](pak07_dir.vpk) · [Review and verification notes](REVIEW.txt)

## What changed

- **One item on the gameplay HUD.** Only the next queued item and its soul amount appear beside the item slots. Extra previews and the number over the next item's icon are hidden. Its position, background, and readiness effects are retained.
- **Simpler queue prices.** Item rows show their normal soul icon and price, without the added slash and cumulative amount.
- **Total Cost at the top of the shop queue.** The original top box shows the full-queue total and remains visible at `0` when the queue is empty. There is no footer cost box or duplicate next-item amount in the shop.

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

## Replacing an existing installation

Close Deadlock and back up the installed Enhanced Quickbuy VPK outside the game's mod folder. Replace it with `pak07_dir.vpk`, using the installed file's existing name, then relaunch. Load only one version at a time. Restore the backup to revert.

## Verification status

The current package passed archive integrity checks, Source 2 Viewer verification/decompilation, and **28 mocked integration tests** during development. These checks cover calculations, refresh behavior, panel structure, and selected CSS visibility rules; they do not render Deadlock.

The latest build has **not been verified in-game**. See [REVIEW.txt](REVIEW.txt) for the artifact hash, limitations, and a short in-game checklist. This repository contains the packaged mod and documentation; the development scripts and test harness are not included.

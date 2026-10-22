# EnhancedQuickbuy-Tweaked
My custom version of the Enhanced Quickbuy mod for the PC game Deadlock

Enhanced QuickBuy — Souls Needed

Installable file: enhanced_quickbuy_souls_needed.vpk

Changes
- Only the next queued item appears beside the item slots during gameplay.
  Extra preview icons and their soul labels are hidden. The next item's
  icon, soul label, and position remain unchanged; the full shop queue remains.
- In the open shop, queued items retain their normal soul icon and price.
  The added slash and cumulative price are hidden.
- The existing top Total Cost box is now Souls Needed. It shows the next
  queued item's purchase price minus current souls and the mod's estimated
  queued-sale proceeds, clamped to zero.
- The top box remains visible at zero and retains its normal appearance
  when the queue is empty.
- Total Cost now appears in a compact box at the lower right of the queue
  footer, opposite Clear Queue. The footer remains outside both scrolling
  queues, with the panel's existing edge padding.
- The numeric count over the small gameplay quickbuy icon is hidden.
  Its icon, filter/background, soul counters, readiness effects, and
  placement are retained. The original queue-total calculation is unchanged.

Pricing
The mod continues to read the game's displayed purchase price (ModCost).
Owned-component discounts therefore follow that native price; no second
inventory discount has been introduced.
Queued-sale estimates retain the original mod's behavior: half of each
queued sale item's displayed price, rounded down. They are counted once.
Total Cost retains its existing treatment of queue upgrades and sale
estimates; it does not subtract the player's current soul balance.

Optional Universal Mod Manager
The old "Queue costs in shop" setting is now "Souls needed in shop" and
controls the top box. "Total queue cost in shop" controls the footer.
Both are enabled by default. Existing saved toggle values are retained.
The mod's global enable switch and gameplay HUD settings still apply.
This customized build always hides extra HUD previews, even if Universal
Mod Manager has a saved "Items shown" value above 1. That slider cannot
re-enable the extra icons in this build.

Installation
1. Close Deadlock.
2. Back up your currently installed Enhanced QuickBuy VPK outside the
   game's mod/addons folder.
3. Copy enhanced_quickbuy_souls_needed.vpk into that same installation
   folder, using the same filename your installed version used.
4. Replace the old version; do not load both versions together.
5. Relaunch the game.

The original /Users/ghempy/Downloads/enhanced_quickbuy_unmodified.vpk
was not changed. Nothing was installed into the game automatically.
To undo this change, close the game and restore your backed-up VPK.

Local verification
- Verified original and rebuilt archive CRC32 and MD5 integrity.
- Source 2 Viewer 20.1 successfully verified and decompiled the rebuilt VPK.
- The extracted modified script exactly matches the tested source and
  passes JavaScript syntax validation.
- Both compiled layouts are byte-for-byte unchanged.
- The latest next-item-only fix only appends a visibility rule for the extra
  preview container. The script, both layouts, and item stylesheet are identical
  to the preceding count-removal VPK; all positioning rules are retained.
- The script's cost calculation functions are unchanged.
- All 27 mocked integration tests passed, covering affordability, empty
  queues, sales, upgrade ordering, native price changes, refreshes, settings,
  HUD parity, footer uniqueness, shop visibility-rule precedence, and
  fraction removal with only the item stylesheet loaded, and gameplay count
  removal without changing soul labels or badge styling. The next-item-only
  checks cover empty, short, and long queues; saved preview counts 1-5;
  shop reopening; and next-item soul updates after queue changes.
- Appended CSS keeps the original stylesheet and source map.
  The modified resource's block offsets, sizes, and content CRC were rebuilt.
- Follow-up review corrected padding before the stylesheet source-map block
  so every resource block retains the original 16-byte alignment.

In-game verification is still required
No actual Deadlock session was run here. Mocked panel tests and archive
checks cannot prove the engine's rendering, current native item pricing,
or compatibility with other installed HUD mods.

Suggested in-game check
1. Queue an 800-soul item while holding 300 souls: Souls Needed should be 500.
2. Add a queued sale whose displayed price is 400: the estimate is 200,
   so Souls Needed should become 300.
3. Reach affordability: the box should remain visible and show 0.
4. Reorder items, remove sales, purchase an item, and clear the queue:
   both displays should update and an empty queue should show 0.
5. Check an upgrade with an owned component: use the shop's actual purchase
   price as the reference for the expected shortfall.
6. Fill and scroll a long queue: Total Cost should stay in the footer,
   clear of Clear Queue, item rows, and the scrollbar.
7. Close the shop with multiple items queued: the small quickbuy icon should
   have no numeric count over it. Check that its soul amounts, filter,
   readiness effects, and placement remain as before.
8. With three or more queued items, only the next icon and its soul amount
   should appear beside your item slots. Purchase/remove the first item or
   reorder the queue: the native icon should advance normally. Reopen the
   shop and confirm the full queue and both cost boxes remain available.

If spacing needs adjustment, provide a screenshot of the full shop and a
close-up of the queue, together with your resolution and UI scale.

Output SHA-256:
6fae0464dd212a61969e2d26dde6ce8786650797922e02dd610fda93355dfb63

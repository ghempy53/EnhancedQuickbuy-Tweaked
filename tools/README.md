# Build and verification tools

These scripts rebuild and check the HUD-count variants. They are not part of any VPK. They need Python 3 and Node.js, and use only standard libraries.

Run them from the repository root.

## Rebuild or verify the 2- and 3-item VPKs

```bash
python3 -I tools/build_variants.py --check
```

`--check` rebuilds both variants from the 1-item `pak07_dir.vpk` and confirms they match the committed files byte-for-byte. Without `--check`, it writes `variants/2-items/pak07_dir.vpk` and `variants/3-items/pak07_dir.vpk`.

The build replaces one appended rule in `panorama/styles/eqb_quickbuy.vcss_c`. It fails unless:

- the VPK writer reproduces the base archive exactly;
- the stylesheet rebuilder reproduces the unchanged resource exactly;
- each output passes CRC32 and MD5 validation when re-read.

## Run the HUD visibility test

```bash
python3 -I tools/extract_test_inputs.py /tmp/eqb-test
```

```bash
node tools/hud_test.js /tmp/eqb-test
```

The test runs the packaged script against a mocked Panorama panel tree. It resolves the packaged stylesheet's `visibility` rules by selector matching, specificity, and source order. It covers:

- queue sizes 0–6;
- the Items shown setting, unset or 1–5;
- gameplay, shop open, dead, and HUD-items-off states;
- the documented price examples, with and without a queued sale.

It does not render Deadlock, so it cannot check layout, overlap, or clipping.

To include the original mod as a reference run, pass its VPK to the extract step with `--original <path>`. It is not included in this repository. The script checks it against the SHA-256 recorded in `REVIEW.txt`.

## Inspect a VPK

```bash
python3 -I tools/vpk.py variants/3-items/pak07_dir.vpk
```

This lists entries and validates CRC32 and MD5 values. Add a directory argument to extract them.

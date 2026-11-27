"""Extract the script and stylesheets that tools/hud_test.js evaluates.

  python3 -I tools/extract_test_inputs.py <out_dir> [--original <original_vpk>]

Writes script.js and css_1.css, css_2.css, css_3.css from the committed VPKs.
With --original, also writes css_orig.css from the unmodified Enhanced QuickBuy VPK
(not included in this repository), which the test uses as a reference.
"""
import hashlib
import os
import sys

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TOOLS)
sys.path.insert(0, TOOLS)
import res  # noqa: E402
import vpk  # noqa: E402

SCRIPT_PATH = "panorama/scripts/hud_quickbuy_total_summary.vjs_c"
ORIGINAL_SHA256 = "3bfdb4990a849f35f42d91621bff0f01fc66c46e501234b9c3e05514b15218c2"

BUILDS = {
    1: os.path.join(ROOT, "pak07_dir.vpk"),
    2: os.path.join(ROOT, "variants", "2-items", "pak07_dir.vpk"),
    3: os.path.join(ROOT, "variants", "3-items", "pak07_dir.vpk"),
}


def main():
    args = sys.argv[1:]
    out_dir = args[0]
    original = args[args.index("--original") + 1] if "--original" in args else None
    os.makedirs(out_dir, exist_ok=True)

    scripts = set()
    for count, path in BUILDS.items():
        files, _ = vpk.parse(open(path, "rb").read())
        css = res.css_text(files["panorama/styles/eqb_quickbuy.vcss_c"])
        open(os.path.join(out_dir, f"css_{count}.css"), "wb").write(css)
        scripts.add(res.script_text(files[SCRIPT_PATH]))
    assert len(scripts) == 1, "the packaged script differs between builds"
    open(os.path.join(out_dir, "script.js"), "wb").write(scripts.pop())

    if original:
        data = open(original, "rb").read()
        assert hashlib.sha256(data).hexdigest() == ORIGINAL_SHA256, "not the recorded original VPK"
        files, _ = vpk.parse(data)
        css = res.css_text(files["panorama/styles/hud_quickbuy.vcss_c"], verify_crc=False)
        open(os.path.join(out_dir, "css_orig.css"), "wb").write(css)
    print(f"wrote test inputs to {out_dir}")


if __name__ == "__main__":
    main()

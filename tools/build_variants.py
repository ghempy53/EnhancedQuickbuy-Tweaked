"""Build the 2- and 3-item HUD variants from the 1-item pak07_dir.vpk.

  python3 -I tools/build_variants.py          # write variants/{2,3}-items/pak07_dir.vpk
  python3 -I tools/build_variants.py --check  # verify the committed variants are reproduced exactly

Only one appended rule in panorama/styles/eqb_quickbuy.vcss_c changes. Every other
resource, and the stylesheet's RED2 and SrMa blocks, are copied byte-for-byte.
"""
import hashlib
import os
import sys

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TOOLS)
sys.path.insert(0, TOOLS)
import res  # noqa: E402
import vpk  # noqa: E402

BASE_VPK = os.path.join(ROOT, "pak07_dir.vpk")
CSS_PATH = "panorama/styles/eqb_quickbuy.vcss_c"

ONE_ITEM_RULE = (
    "/* Keep only the native next-item HUD icon, regardless of saved preview count. */\n"
    "#QuickbuyUpcomingPreviewContainer\n"
    "{\n"
    "\tvisibility: collapse;\n"
    "}\n"
)

VARIANT_RULES = {
    2: (
        "/* Show at most two HUD items: the native next item and one preview. */\n"
        "#QuickbuyUpcomingPreview3,\n"
        "#QuickbuyUpcomingPreview4,\n"
        "#QuickbuyUpcomingPreview5\n"
        "{\n"
        "\tvisibility: collapse;\n"
        "}\n"
    ),
    3: (
        "/* Show at most three HUD items: the native next item and two previews. */\n"
        "#QuickbuyUpcomingPreview4,\n"
        "#QuickbuyUpcomingPreview5\n"
        "{\n"
        "\tvisibility: collapse;\n"
        "}\n"
    ),
}


def variant_path(count):
    return os.path.join(ROOT, "variants", f"{count}-items", "pak07_dir.vpk")


def build():
    base = open(BASE_VPK, "rb").read()
    files, info = vpk.parse(base)
    # Guards: the writers must reproduce the unchanged inputs exactly.
    assert vpk.write(files, info["order"]) == base, "VPK writer does not round-trip the base VPK"
    css_resource = files[CSS_PATH]
    css = res.css_text(css_resource)
    assert res.rebuild_css(css_resource, css) == css_resource, "CSS rebuild does not round-trip"
    text = css.decode("utf-8")
    assert text.count(ONE_ITEM_RULE) == 1, "expected exactly one preview-container collapse rule"

    outputs = {}
    for count, rule in VARIANT_RULES.items():
        variant_files = dict(files)
        variant_files[CSS_PATH] = res.rebuild_css(css_resource, text.replace(ONE_ITEM_RULE, rule).encode("utf-8"))
        out = vpk.write(variant_files, info["order"])
        vpk.parse(out)  # re-validate CRC32 and MD5 sections
        outputs[count] = out
    return outputs


def main():
    check = "--check" in sys.argv[1:]
    failed = False
    for count, out in build().items():
        dest = variant_path(count)
        digest = hashlib.sha256(out).hexdigest()
        if check:
            same = os.path.exists(dest) and open(dest, "rb").read() == out
            failed |= not same
            print(f"{'OK  ' if same else 'DIFF'} {os.path.relpath(dest, ROOT)}  {len(out)} bytes  sha256={digest}")
        else:
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            open(dest, "wb").write(out)
            print(f"wrote {os.path.relpath(dest, ROOT)}  {len(out)} bytes  sha256={digest}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()

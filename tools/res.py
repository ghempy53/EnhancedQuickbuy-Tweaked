"""Source 2 compiled-resource helpers for the Panorama files in this mod.

vcss_c: blocks RED2, DATA, SrMa. DATA = u32 CRC32(content) + u16 name count (0) + CSS text.
vjs_c (resource version 4): blocks RED2, DATA. DATA is the raw JavaScript.
"""
import struct
import zlib


def align16(n):
    return (n + 15) & ~15


def blocks(buf):
    """Parse the resource header and block table."""
    file_size, _header_version, version, block_offset, block_count = struct.unpack_from("<IHHII", buf, 0)
    assert file_size == len(buf), "resource file_size mismatch"
    out = []
    pos = 8 + block_offset
    for _ in range(block_count):
        kind = buf[pos:pos + 4].decode()
        rel, size = struct.unpack_from("<II", buf, pos + 4)
        # Offsets are relative to the position of the offset field itself.
        out.append({"type": kind, "entry_pos": pos, "off": pos + 4 + rel, "size": size})
        pos += 12
    return version, out


def _block(buf, kind):
    matches = [b for b in blocks(buf)[1] if b["type"] == kind]
    assert len(matches) == 1, f"expected one {kind} block"
    return matches[0]


def css_text(buf, verify_crc=True):
    """Return the CSS bytes from a vcss_c resource, validating its DATA CRC32 by default.

    The original Enhanced QuickBuy stylesheets carry CRCs that do not match their text,
    so pass verify_crc=False to read those.
    """
    data = _block(buf, "DATA")
    crc, name_count = struct.unpack_from("<IH", buf, data["off"])
    assert name_count == 0, "unexpected DATA name table"
    content = buf[data["off"] + 6:data["off"] + data["size"]]
    if verify_crc:
        assert zlib.crc32(content) & 0xFFFFFFFF == crc, "DATA CRC32 mismatch"
    return content


def script_text(buf):
    """Return the JavaScript bytes from a version-4 vjs_c resource."""
    version, _ = blocks(buf)
    assert version == 4, f"unsupported vjs_c version {version}"
    data = _block(buf, "DATA")
    return buf[data["off"]:data["off"] + data["size"]]


def rebuild_css(buf, content):
    """Replace a vcss_c DATA block's CSS, keeping RED2/SrMa bytes and 16-byte block alignment."""
    _, blks = blocks(buf)
    assert [b["type"] for b in blks] == ["RED2", "DATA", "SrMa"]
    red2, data, srma = blks
    assert data["off"] == align16(red2["off"] + red2["size"])
    assert srma["off"] == align16(data["off"] + data["size"])
    assert srma["off"] + srma["size"] == len(buf), "unexpected data after SrMa"

    new_data = struct.pack("<IH", zlib.crc32(content) & 0xFFFFFFFF, 0) + content
    new_srma_off = align16(data["off"] + len(new_data))
    out = bytearray(buf[:data["off"]])
    out += new_data
    out += b"\0" * (new_srma_off - len(out))
    out += buf[srma["off"]:srma["off"] + srma["size"]]
    struct.pack_into("<I", out, 0, len(out))
    struct.pack_into("<I", out, data["entry_pos"] + 8, len(new_data))
    struct.pack_into("<I", out, srma["entry_pos"] + 4, new_srma_off - (srma["entry_pos"] + 4))
    return bytes(out)

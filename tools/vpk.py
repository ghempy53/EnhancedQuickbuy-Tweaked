"""Minimal reader/writer for single-archive VPK v2 files (all data in the _dir file).

CLI: python3 -I tools/vpk.py <file.vpk> [extract_dir]
Lists entries (validating CRC32 and MD5 sections) and optionally extracts them.
"""
import hashlib
import os
import struct
import sys
import zlib

SIGNATURE = 0x55AA1234
HEADER_SIZE = 28
EMBEDDED_ARCHIVE = 0x7FFF


def _cstr(buf, pos):
    end = buf.index(b"\0", pos)
    return buf[pos:end].decode("utf-8"), end + 1


def parse(data):
    """Return ({path: bytes}, info). Raises AssertionError on any integrity failure."""
    sig, ver, tree_size, data_size, archive_md5_size, other_md5_size, sig_size = struct.unpack_from("<7I", data, 0)
    assert sig == SIGNATURE, hex(sig)
    assert ver == 2, ver
    assert archive_md5_size == 0 and other_md5_size == 48 and sig_size == 0, "unsupported VPK section layout"

    pos = HEADER_SIZE
    entries = []
    while True:
        ext, pos = _cstr(data, pos)
        if not ext:
            break
        while True:
            directory, pos = _cstr(data, pos)
            if not directory:
                break
            while True:
                name, pos = _cstr(data, pos)
                if not name:
                    break
                crc, preload, archive, offset, length, term = struct.unpack_from("<IHHIIH", data, pos)
                pos += 18
                assert term == 0xFFFF and preload == 0 and archive == EMBEDDED_ARCHIVE
                full = (directory + "/" if directory != " " else "") + name + "." + ext
                entries.append((full, crc, offset, length))
    assert pos == HEADER_SIZE + tree_size, "tree size mismatch"

    data_start = HEADER_SIZE + tree_size
    files = {}
    for full, crc, offset, length in entries:
        body = data[data_start + offset:data_start + offset + length]
        assert len(body) == length and zlib.crc32(body) & 0xFFFFFFFF == crc, f"CRC32 mismatch: {full}"
        files[full] = body

    md5_start = data_start + data_size
    assert len(data) == md5_start + 48, "unexpected trailing data"
    tree_md5, archive_md5, whole_md5 = (data[md5_start + i:md5_start + i + 16] for i in (0, 16, 32))
    assert hashlib.md5(data[HEADER_SIZE:data_start]).digest() == tree_md5, "tree MD5 mismatch"
    assert hashlib.md5(b"").digest() == archive_md5, "archive MD5 mismatch"
    assert hashlib.md5(data[:md5_start + 32]).digest() == whole_md5, "whole-file MD5 mismatch"
    return files, {"order": [e[0] for e in entries]}


def write(files, order):
    """Write a single-archive VPK v2 with entries in `order` and contiguous data."""
    groups = {}
    for full in order:
        directory, base = full.rsplit("/", 1)
        name, ext = base.rsplit(".", 1)
        groups.setdefault(ext, {}).setdefault(directory, []).append((name, full))
    tree = bytearray()
    blob = bytearray()
    for ext, dirs in groups.items():
        tree += ext.encode() + b"\0"
        for directory, names in dirs.items():
            tree += directory.encode() + b"\0"
            for name, full in names:
                body = files[full]
                tree += name.encode() + b"\0"
                tree += struct.pack("<IHHIIH", zlib.crc32(body) & 0xFFFFFFFF, 0, EMBEDDED_ARCHIVE,
                                    len(blob), len(body), 0xFFFF)
                blob += body
            tree += b"\0"
        tree += b"\0"
    tree += b"\0"
    head = struct.pack("<7I", SIGNATURE, 2, len(tree), len(blob), 0, 48, 0) + tree + blob
    tree_md5 = hashlib.md5(tree).digest()
    archive_md5 = hashlib.md5(b"").digest()
    return head + tree_md5 + archive_md5 + hashlib.md5(head + tree_md5 + archive_md5).digest()


if __name__ == "__main__":
    vpk_files, vpk_info = parse(open(sys.argv[1], "rb").read())
    for path in vpk_info["order"]:
        body = vpk_files[path]
        print(f"{path}  {len(body)} bytes  crc32={zlib.crc32(body) & 0xFFFFFFFF:08x}")
    if len(sys.argv) > 2:
        for path, body in vpk_files.items():
            dest = os.path.join(sys.argv[2], path)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            open(dest, "wb").write(body)

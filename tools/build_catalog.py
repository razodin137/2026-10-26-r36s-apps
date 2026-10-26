#!/usr/bin/env python3
"""Build the cartridge catalog for the R36S shell.

The shell lists the games a player can boot. A browser cannot ask a web server
"which folders do you have?", so this script walks ``cartridges/``, reads the
metadata in each cartridge directory, and writes a single ``cartridges/catalog.json``
the shell can fetch.

Every cartridge directory may include a ``cartridge.json`` file describing it. A
directory with a valid ``index.html`` but no metadata still shows up in the
catalog, using sensible defaults, so a cartridge can be dropped in and booted
before it has been polished.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
CARTRIDGES_DIR = ROOT / "cartridges"
CATALOG_PATH = CARTRIDGES_DIR / "catalog.json"
METADATA_FILENAME = "cartridge.json"
DEFAULT_ENTRY = "index.html"
CATALOG_VERSION = 1


def slugify(name: str) -> str:
    """Turn a directory name into a lowercase, dash-separated slug."""
    slug = re.sub(r"[^a-z0-9]+", "-", name.strip().lower())
    return slug.strip("-") or "cartridge"


def titleize(name: str) -> str:
    """Turn a directory name into a human-readable title."""
    words = re.sub(r"[-_]+", " ", name.strip()).split()
    return " ".join(word.capitalize() for word in words) or "Cartridge"


def read_metadata(directory: Path) -> dict[str, Any]:
    """Read a cartridge's optional ``cartridge.json`` metadata file."""
    metadata_path = directory / METADATA_FILENAME
    if not metadata_path.is_file():
        return {}

    try:
        with metadata_path.open(encoding="utf-8") as handle:
            metadata = json.load(handle)
    except json.JSONDecodeError as error:
        raise ValueError(f"{metadata_path} is not valid JSON: {error}") from error

    if not isinstance(metadata, dict):
        raise ValueError(f"{metadata_path} must contain a JSON object")

    return metadata


def describe(directory: Path) -> dict[str, Any] | None:
    """Describe one cartridge directory, or return None if it is not a cartridge."""
    entry = DEFAULT_ENTRY
    metadata = read_metadata(directory)
    if metadata.get("entry"):
        entry = str(metadata["entry"])

    entry_path = directory / entry
    if not entry_path.is_file():
        return None

    title = str(metadata.get("title") or titleize(directory.name))
    description = str(metadata.get("description") or "")
    author = str(metadata.get("author") or "Unknown")
    version = str(metadata.get("version") or "0.0.0")
    tags = metadata.get("tags") or []
    if not isinstance(tags, list):
        tags = []

    return {
        "slug": str(metadata.get("slug") or slugify(directory.name)),
        "title": title,
        "author": author,
        "version": version,
        "description": description,
        "entry": entry,
        "url": f"/cartridges/{directory.name}/{entry}",
        "tags": [str(tag) for tag in tags],
    }


def collect(cartridges_dir: Path) -> list[dict[str, Any]]:
    """Describe every cartridge in the cartridges directory, sorted by title."""
    if not cartridges_dir.is_dir():
        return []

    cartridges = []
    for directory in sorted(cartridges_dir.iterdir()):
        if not directory.is_dir() or directory.name.startswith((".", "_")):
            continue

        cartridge = describe(directory)
        if cartridge:
            cartridges.append(cartridge)

    return sorted(cartridges, key=lambda cartridge: cartridge["title"].lower())


def build(cartridges_dir: Path = CARTRIDGES_DIR, catalog_path: Path = CATALOG_PATH) -> dict[str, Any]:
    """Write the catalog file and return the catalog it wrote."""
    catalog = {
        "version": CATALOG_VERSION,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "cartridges": collect(cartridges_dir),
    }

    catalog_path.parent.mkdir(parents=True, exist_ok=True)
    with catalog_path.open("w", encoding="utf-8") as handle:
        json.dump(catalog, handle, indent=2)
        handle.write("\n")

    return catalog


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the R36S cartridge catalog.")
    parser.add_argument("--quiet", action="store_true", help="Only report problems.")
    arguments = parser.parse_args()

    try:
        catalog = build()
    except ValueError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    if not arguments.quiet:
        count = len(catalog["cartridges"])
        noun = "cartridge" if count == 1 else "cartridges"
        print(f"Wrote {CATALOG_PATH.relative_to(ROOT)} with {count} {noun}.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

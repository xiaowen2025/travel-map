#!/usr/bin/env python3
"""Clean up destinations.json - remove stale error fields."""

import json
import os

assets_dir = "public/assets/destinations"
sources_file = os.path.join(assets_dir, "destinations.json")

with open(sources_file, "r", encoding="utf-8") as f:
    sources = json.load(f)

# Clean up entries with stale error fields
for name, data in sources.items():
    if "error" in data and data.get("url"):
        del data["error"]

# Save
with open(sources_file, "w", encoding="utf-8") as f:
    json.dump(sources, f, indent=2, ensure_ascii=False)

# Print summary
downloaded = sum(1 for s in sources.values() if s.get("status") == "downloaded")
with_url = sum(1 for s in sources.values() if s.get("url"))
print(f"Total: {len(sources)}")
print(f"Downloaded: {downloaded}")
print(f"With URL: {with_url}")
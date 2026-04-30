#!/usr/bin/env python3
"""Fix destinations.json - update status for all existing images."""

import json
import os

assets_dir = "public/assets/destinations"
sources_file = os.path.join(assets_dir, "destinations.json")

# Load existing sources
if os.path.exists(sources_file):
    with open(sources_file, "r", encoding="utf-8") as f:
        sources = json.load(f)
else:
    sources = {}

# Find all jpg files
image_files = [f for f in os.listdir(assets_dir) if f.endswith('.jpg')]

# Get destination names from file names
for filename in image_files:
    dest_name = filename.replace('.jpg', '').replace('_', ' ')
    if dest_name not in sources:
        sources[dest_name] = {"status": "downloaded", "destination": dest_name}
    elif sources[dest_name].get("status") != "downloaded":
        if sources[dest_name].get("url"):
            sources[dest_name]["status"] = "downloaded"
        else:
            sources[dest_name]["status"] = "downloaded"

# Save updated sources
with open(sources_file, "w", encoding="utf-8") as f:
    json.dump(sources, f, indent=2, ensure_ascii=False)

# Print summary
downloaded = sum(1 for s in sources.values() if s.get("status") == "downloaded")
print(f"Total destinations tracked: {len(sources)}")
print(f"Downloaded: {downloaded}")
print(f"Images in folder: {len(image_files)}")
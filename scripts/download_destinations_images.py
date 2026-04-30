#!/usr/bin/env python3
"""Resume downloading destination images for destinations with no_image status."""

import json
import os
import time
import urllib.request
import urllib.parse

# Load destinations
with open("public/data/destinations.json", "r", encoding="utf-8") as f:
    data = json.load(f)

destinations = data["destinations"]
print(f"Total destinations: {len(destinations)}")

# Create assets directory
assets_dir = "public/assets/destinations"
os.makedirs(assets_dir, exist_ok=True)

# Output file for source tracking
sources_file = os.path.join(assets_dir, "destinations.json")

# Load existing sources
existing_sources = {}
if os.path.exists(sources_file):
    with open(sources_file, "r", encoding="utf-8") as f:
        existing_sources = json.load(f)

sources = existing_sources.copy()

def sanitize_filename(name):
    """Sanitize filename for filesystem."""
    name = name.replace(" ", "_").replace("/", "_").replace("\\", "_")
    name = name.replace("'", "").replace('"', "").replace("?", "")
    name = name.replace(":", "-").replace("|", "-").replace("*", "")
    return name

def search_wikimedia_panorama(destination_name, country):
    """Search for panorama/observation deck images on Wikimedia Commons."""
    search_terms = [
        f'"{destination_name}" panorama',
        f'"{destination_name}" observation deck',
        f'"{destination_name}" skyline view',
        f'"{destination_name}" city view',
        f'"{destination_name}" {country} panorama',
        f'"{destination_name}" aerial view',
        f'"{destination_name}" {country}',
        destination_name,
    ]

    for term in search_terms:
        try:
            encoded_term = urllib.parse.quote(term)
            url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={encoded_term}&srnamespace=6&format=json&srlimit=15"

            req = urllib.request.Request(url, headers={
                "User-Agent": "TravelMapBot/1.0 (image collector for travel project)"
            })
            with urllib.request.urlopen(req, timeout=20) as response:
                result = json.loads(response.read().decode("utf-8"))

            search_results = result.get("query", {}).get("search", [])

            for item in search_results:
                title = item.get("title", "")
                if not title.startswith("File:"):
                    continue

                filename = title[5:]

                skip_patterns = [
                    'icon', 'logo', 'symbol', 'flag', 'Armoir', 'Blason', 'icon_', 'Icon',
                    'coa', 'coat', 'herald', 'emoji', 'button', 'badge', 'stub'
                ]
                if any(p.lower() in filename.lower() for p in skip_patterns):
                    continue

                lower = filename.lower()
                if not any(lower.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                    continue

                image_url = get_file_url(filename)
                if image_url:
                    return image_url, filename

        except Exception as e:
            print(f"  Search error for '{term}': {e}")

        time.sleep(0.5)

    return None, None

def get_file_url(filename):
    """Get the direct URL for a Wikimedia Commons file."""
    try:
        safe_filename = urllib.parse.quote(filename.replace(" ", "_"))
        url = f"https://commons.wikimedia.org/w/api.php?action=query&titles=File:{safe_filename}&prop=imageinfo&iiprop=url&format=json"

        req = urllib.request.Request(url, headers={
            "User-Agent": "TravelMapBot/1.0 (image collector for travel project)"
        })
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode("utf-8"))

        pages = result.get("query", {}).get("pages", {})
        for page in pages.values():
            if "imageinfo" in page and page["imageinfo"]:
                return page["imageinfo"][0].get("url")

    except Exception:
        pass
    return None

def download_image(url, dest_path):
    """Download an image from URL to dest_path."""
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "TravelMapBot/1.0 (image collector for travel project)"
        })
        with urllib.request.urlopen(req, timeout=30) as response:
            content = response.read()
            if len(content) > 15000:
                with open(dest_path, "wb") as f:
                    f.write(content)
                return True
            else:
                print(f"  Image too small: {len(content)} bytes")
    except Exception as e:
        print(f"  Download error: {e}")
    return False

# Get destinations that need images
needs_images = []
for dest in destinations:
    name = dest["Destination"]
    status = sources.get(name, {}).get("status")
    if status in ["no_image", None]:
        needs_images.append(dest)

print(f"Destinations needing images: {len(needs_images)}")
print()

# Process destinations needing images
processed = 0
failed = 0

for i, dest in enumerate(needs_images):
    name = dest["Destination"]
    country = dest.get("Country", "")
    safe_name = sanitize_filename(name)
    image_path = os.path.join(assets_dir, f"{safe_name}.jpg")

    # Check if already exists
    if os.path.exists(image_path):
        print(f"[{i+1}/{len(needs_images)}] {name} - already exists")
        sources[name] = sources.get(name, {})
        sources[name]["status"] = "downloaded"
        continue

    print(f"[{i+1}/{len(needs_images)}] Downloading: {name} ({country})")

    image_url, filename = search_wikimedia_panorama(name, country)

    if image_url:
        if download_image(image_url, image_path):
            sources[name] = {
                "url": image_url,
                "filename": filename,
                "source": "Wikimedia Commons",
                "destination": name,
                "country": country,
                "status": "downloaded"
            }
            print(f"  ✓ Downloaded: {filename}")
            processed += 1
        else:
            print(f"  ✗ Failed to save")
            sources[name] = sources.get(name, {})
            sources[name]["status"] = "failed"
            failed += 1
    else:
        print(f"  ✗ No image found")
        sources[name] = sources.get(name, {})
        sources[name]["status"] = "no_image"
        failed += 1

    # Save progress every 20 destinations
    if (i + 1) % 20 == 0:
        with open(sources_file, "w", encoding="utf-8") as f:
            json.dump(sources, f, indent=2, ensure_ascii=False)
        print(f"  --- Progress saved ({processed} downloaded, {failed} failed) ---")

    time.sleep(0.6)

print(f"\n=== Summary ===")
print(f"Downloaded: {processed}")
print(f"Failed/No image: {failed}")

with open(sources_file, "w", encoding="utf-8") as f:
    json.dump(sources, f, indent=2, ensure_ascii=False)

print(f"Sources saved to: {sources_file}")
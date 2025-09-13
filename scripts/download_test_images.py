#!/usr/bin/env python3
"""
Download test images from the Met Museum API for PixelPrep testing.

Uses the Metropolitan Museum of Art Collection API to fetch high-quality artwork
images with different aspect ratios and formats for testing the image optimization pipeline.

API Documentation: https://metmuseum.github.io/
"""

import sys
from pathlib import Path
from urllib.parse import urlparse

import requests
from PIL import Image

# Add backend to path for imports
sys.path.append(str(Path(__file__).parent.parent / "backend" / "src"))

BASE_API_URL = "https://collectionapi.metmuseum.org/public/collection/v1"
OUTPUT_DIR = Path(__file__).parent.parent / "backend" / "test_images"

# Curated object IDs for different aspect ratios and art types
TARGET_OBJECTS = [
    # Landscape paintings
    {"id": 436532, "expected_ratio": "landscape", "type": "painting"},  # Van Gogh - Wheat Field
    {"id": 437853, "expected_ratio": "landscape", "type": "painting"},  # Monet - Water Lilies
    {"id": 459123, "expected_ratio": "landscape", "type": "painting"},  # American landscape

    # Portrait paintings
    {"id": 436105, "expected_ratio": "portrait", "type": "painting"},   # Sargent portrait
    {"id": 437394, "expected_ratio": "portrait", "type": "painting"},   # Picasso portrait
    {"id": 459080, "expected_ratio": "portrait", "type": "painting"},   # Renaissance portrait

    # Square/near-square works
    {"id": 488315, "expected_ratio": "square", "type": "sculpture"},    # Egyptian art
    {"id": 547802, "expected_ratio": "square", "type": "decorative"},   # Islamic art
    {"id": 436121, "expected_ratio": "square", "type": "painting"},     # Modern square composition
]

def setup_output_directory():
    """Create output directory if it doesn't exist."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"📁 Output directory: {OUTPUT_DIR}")

def fetch_object_info(object_id: int) -> dict | None:
    """Fetch object information from Met API."""
    url = f"{BASE_API_URL}/objects/{object_id}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"❌ Failed to fetch object {object_id}: {e}")
        return None

def get_image_aspect_ratio(image_url: str) -> str:
    """Determine aspect ratio of image from URL without downloading full image."""
    try:
        # Download just the header to get dimensions
        response = requests.get(image_url, stream=True, timeout=10)
        response.raise_for_status()

        # Try to get dimensions from image headers
        with Image.open(response.raw) as img:
            width, height = img.size
            ratio = width / height

            if ratio > 1.2:
                return "landscape"
            elif ratio < 0.8:
                return "portrait"
            else:
                return "square"

    except Exception as e:
        print(f"⚠️  Could not determine aspect ratio: {e}")
        return "unknown"

def download_image(image_url: str, filename: str) -> bool:
    """Download image from URL to local file."""
    try:
        response = requests.get(image_url, stream=True, timeout=30)
        response.raise_for_status()

        file_path = OUTPUT_DIR / filename
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        # Verify the downloaded image
        with Image.open(file_path) as img:
            width, height = img.size
            file_size_mb = file_path.stat().st_size / (1024 * 1024)
            print(f"✅ Downloaded: {filename} ({width}×{height}, {file_size_mb:.1f}MB)")
            return True

    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")
        return False

def generate_filename(obj_data: dict, expected_ratio: str, obj_type: str) -> str:
    """Generate descriptive filename for downloaded image."""
    # Clean title for filename
    title = obj_data.get('title', 'Untitled')
    title = ''.join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
    title = title.replace(' ', '_')[:30]  # Limit length

    # Get image extension
    image_url = obj_data.get('primaryImage', '')
    parsed = urlparse(image_url)
    ext = Path(parsed.path).suffix.lower()
    if not ext or ext not in ['.jpg', '.jpeg', '.png']:
        ext = '.jpg'

    artist = obj_data.get('artistDisplayName', 'Unknown')
    artist = ''.join(c for c in artist if c.isalnum() or c in (' ', '-', '_')).strip()
    artist = artist.replace(' ', '_')[:20] if artist != 'Unknown' else 'Unknown'

    return f"met_{expected_ratio}_{obj_type}_{artist}_{title}{ext}"

def main():
    """Download test images from Met Museum API."""
    print("🎨 PixelPrep Test Image Downloader")
    print("📡 Fetching artwork from the Metropolitan Museum of Art")
    print()

    setup_output_directory()

    downloaded_count = 0
    failed_count = 0

    for target in TARGET_OBJECTS:
        object_id = target["id"]
        expected_ratio = target["expected_ratio"]
        obj_type = target["type"]

        print(f"🔍 Fetching object {object_id} (expected: {expected_ratio} {obj_type})")

        # Get object information
        obj_data = fetch_object_info(object_id)
        if not obj_data:
            failed_count += 1
            continue

        # Check if image is available
        image_url = obj_data.get('primaryImage')
        if not image_url:
            print(f"❌ No primary image available for object {object_id}")
            failed_count += 1
            continue

        # Generate filename
        filename = generate_filename(obj_data, expected_ratio, obj_type)

        # Check if already downloaded
        if (OUTPUT_DIR / filename).exists():
            print(f"⏭️  Already exists: {filename}")
            continue

        # Download the image
        if download_image(image_url, filename):
            downloaded_count += 1

            # Print artwork info
            title = obj_data.get('title', 'Untitled')
            artist = obj_data.get('artistDisplayName', 'Unknown Artist')
            date = obj_data.get('objectDate', 'Unknown Date')
            print(f"   📋 {title} by {artist} ({date})")
        else:
            failed_count += 1

        print()  # Empty line for readability

    # Summary
    print("=" * 50)
    print(f"✅ Successfully downloaded: {downloaded_count} images")
    print(f"❌ Failed downloads: {failed_count} images")

    # List all images in the directory
    print(f"\n📂 Test images in {OUTPUT_DIR}:")
    image_files = list(OUTPUT_DIR.glob("*.jpg")) + list(OUTPUT_DIR.glob("*.png"))

    for img_path in sorted(image_files):
        try:
            with Image.open(img_path) as img:
                width, height = img.size
                ratio = width / height
                aspect = "landscape" if ratio > 1.2 else "portrait" if ratio < 0.8 else "square"
                file_size_mb = img_path.stat().st_size / (1024 * 1024)
                print(f"   📸 {img_path.name} - {width}×{height} ({aspect}, {file_size_mb:.1f}MB)")
        except Exception as e:
            print(f"   ⚠️  {img_path.name} - Could not read image: {e}")

    if downloaded_count > 0:
        print(f"\n🚀 Ready to test PixelPrep with {len(image_files)} images!")
        print("   Run 'just dev' to start the API server")
        print("   Then test /optimize endpoint with these museum artworks")
    else:
        print("\n⚠️  No images were downloaded. Check your internet connection.")

if __name__ == "__main__":
    main()

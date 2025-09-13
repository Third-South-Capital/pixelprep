#!/usr/bin/env python3
"""
Test all PixelPrep presets with a single image to showcase all capabilities.
"""

import json
import sys
import zipfile
from datetime import datetime
from pathlib import Path

import requests
from PIL import Image

# Add backend to path for imports
sys.path.append(str(Path(__file__).parent.parent / "backend" / "src"))

API_BASE_URL = "http://localhost:8000"
TEST_IMAGES_DIR = Path(__file__).parent.parent / "backend" / "test_images"
RESULTS_DIR = Path(__file__).parent.parent / "backend" / "test_results"

def setup_directories():
    """Ensure all result directories exist."""
    for subdir in ["all_presets", "reports"]:
        (RESULTS_DIR / subdir).mkdir(parents=True, exist_ok=True)

def get_available_presets():
    """Get list of available presets from API."""
    try:
        response = requests.get(f"{API_BASE_URL}/optimize/processors", timeout=5)
        response.raise_for_status()
        data = response.json()
        return list(data['processors'].keys())
    except requests.RequestException as e:
        print(f"❌ Could not get presets: {e}")
        return []

def optimize_with_preset(image_path: Path, preset: str):
    """Optimize image with specific preset."""
    print(f"  🎨 {preset}")

    try:
        with open(image_path, 'rb') as f:
            files = {"file": (image_path.name, f, "image/jpeg")}
            data = {"preset": preset}

            response = requests.post(
                f"{API_BASE_URL}/optimize/",
                files=files,
                data=data,
                timeout=30
            )
            response.raise_for_status()

        # Save ZIP and extract
        zip_path = RESULTS_DIR / "all_presets" / f"{image_path.stem}_{preset}.zip"
        with open(zip_path, 'wb') as f:
            f.write(response.content)

        # Extract optimized image
        with zipfile.ZipFile(zip_path, 'r') as zip_file:
            image_files = [f for f in zip_file.namelist() if f.endswith(('.jpg', '.jpeg', '.webp', '.png'))]
            if image_files:
                optimized_filename = image_files[0]
                zip_file.extract(optimized_filename, RESULTS_DIR / "all_presets")

                # Read metadata
                metadata_content = zip_file.read("metadata.json")
                metadata = json.loads(metadata_content)

                return {
                    "success": True,
                    "preset": preset,
                    "filename": optimized_filename,
                    "metadata": metadata
                }

        return {"success": False, "error": "No optimized image found"}

    except Exception as e:
        return {"success": False, "error": str(e)}

def create_showcase_html(results, output_path, test_image_path):
    """Create HTML showcase of all presets."""

    original_info = {}
    with Image.open(test_image_path) as img:
        file_size = test_image_path.stat().st_size
        original_info = {
            "dimensions": f"{img.size[0]}×{img.size[1]}",
            "file_size_mb": round(file_size / (1024 * 1024), 2),
            "format": img.format
        }

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PixelPrep - All Presets Showcase</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }}
        h1 {{
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
        }}
        .subtitle {{
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 18px;
        }}
        .original-section {{
            background: #e8f5e8;
            border-left: 4px solid #27ae60;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 4px;
            text-align: center;
        }}
        .original-section img {{
            max-width: 400px;
            max-height: 300px;
            object-fit: contain;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
        }}
        .presets-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }}
        .preset-card {{
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            background: white;
        }}
        .preset-header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            font-weight: bold;
            font-size: 18px;
        }}
        .preset-content {{
            padding: 15px;
        }}
        .preset-image {{
            text-align: center;
            margin-bottom: 15px;
        }}
        .preset-image img {{
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f8f9fa;
        }}
        .preset-stats {{
            background: #f8f9fa;
            border-radius: 4px;
            padding: 10px;
            font-size: 14px;
        }}
        .stat-row {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }}
        .stat-row:last-child {{
            margin-bottom: 0;
        }}
        .improvement {{
            color: #27ae60;
            font-weight: bold;
        }}
        .error {{
            background: #ffe6e6;
            border: 1px solid #ffcccc;
            color: #d8000c;
            padding: 15px;
            border-radius: 4px;
            text-align: center;
        }}
        @media (max-width: 768px) {{
            .presets-grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 PixelPrep - All Presets Showcase</h1>
        <div class="subtitle">Complete optimization capabilities demonstration</div>
        
        <div class="original-section">
            <h2>📷 Original Image</h2>
            <img src="../{test_image_path.name}" alt="Original Image" />
            <div style="margin-top: 15px;">
                <strong>Dimensions:</strong> {original_info['dimensions']} | 
                <strong>File Size:</strong> {original_info['file_size_mb']}MB | 
                <strong>Format:</strong> {original_info['format']}
            </div>
        </div>
        
        <div class="presets-grid">"""

    for result in results:
        if result['success']:
            metadata = result['metadata']
            processor_config = metadata.get('processor_config', {})
            inner_metadata = metadata.get('metadata', {})

            preset_name = processor_config.get('name', result['preset'])
            description = processor_config.get('description', 'Optimized version')

            file_size_mb = inner_metadata.get('file_size_mb', 0)
            dimensions = inner_metadata.get('dimensions', 'Unknown')
            format_info = inner_metadata.get('format', 'JPEG')

            # Calculate size reduction
            size_reduction = 0
            if file_size_mb > 0 and original_info['file_size_mb'] > 0:
                size_reduction = (1 - file_size_mb / original_info['file_size_mb']) * 100

            html_content += f"""
            <div class="preset-card">
                <div class="preset-header">
                    {preset_name}
                </div>
                <div class="preset-content">
                    <div class="preset-image">
                        <img src="../all_presets/{result['filename']}" alt="{preset_name}" />
                    </div>
                    <div class="preset-stats">
                        <div class="stat-row">
                            <span>Dimensions:</span>
                            <strong>{dimensions}</strong>
                        </div>
                        <div class="stat-row">
                            <span>File Size:</span>
                            <strong>{file_size_mb}MB</strong>
                        </div>
                        <div class="stat-row">
                            <span>Format:</span>
                            <strong>{format_info}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Size Reduction:</span>
                            <span class="improvement">{size_reduction:.1f}% smaller</span>
                        </div>
                        <div class="stat-row">
                            <span>Use Case:</span>
                            <em>{description}</em>
                        </div>
                    </div>
                </div>
            </div>"""
        else:
            html_content += f"""
            <div class="preset-card">
                <div class="preset-header">
                    {result['preset']}
                </div>
                <div class="preset-content">
                    <div class="error">
                        ❌ Error: {result['error']}
                    </div>
                </div>
            </div>"""

    html_content += f"""
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        </div>
    </div>
</body>
</html>"""

    with open(output_path, 'w') as f:
        f.write(html_content)

def main():
    """Test all presets with one image."""
    print("🎨 PixelPrep All Presets Showcase")
    print("=" * 40)
    print()

    setup_directories()

    # Check API
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        response.raise_for_status()
        print("✅ API is running")
    except:
        print("❌ API not running. Start with: just dev")
        return 1

    # Get available presets
    presets = get_available_presets()
    if not presets:
        print("❌ No presets available")
        return 1

    print(f"📋 Found {len(presets)} presets: {', '.join(presets)}")
    print()

    # Find a good test image
    test_images = list(TEST_IMAGES_DIR.glob("*.jpg"))
    if not test_images:
        print("❌ No test images found")
        return 1

    # Use the first image
    test_image = test_images[0]
    print(f"🖼️ Using test image: {test_image.name}")
    print()

    # Copy original to results
    import shutil
    shutil.copy2(test_image, RESULTS_DIR / "all_presets" / test_image.name)

    # Test each preset
    results = []
    for preset in presets:
        result = optimize_with_preset(test_image, preset)
        results.append(result)

        if result['success']:
            metadata = result['metadata']
            file_size = metadata.get('file_size_mb', 0)
            print(f"     ✅ {file_size}MB")
        else:
            print(f"     ❌ {result['error']}")

    print()
    print("📊 Generating showcase report...")

    # Create showcase HTML
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    html_path = RESULTS_DIR / "reports" / f"all_presets_showcase_{timestamp}.html"
    create_showcase_html(results, html_path, test_image)

    print(f"✅ Showcase created: {html_path}")
    print(f"🌐 Open in browser: file://{html_path.absolute()}")

    return 0

if __name__ == "__main__":
    exit(main())

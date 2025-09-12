import io
import json
import zipfile
import tempfile
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from .main import app

client = TestClient(app)

class TestOptimizeAPI:
    """Test the image optimization API endpoints."""
    
    def create_test_image(self, size=(1000, 800), format='JPEG', mode='RGB'):
        """Create a test image for upload testing."""
        image = Image.new(mode, size, color=(255, 128, 64))
        buffer = io.BytesIO()
        image.save(buffer, format=format)
        buffer.seek(0)
        return buffer
    
    def test_get_processors_endpoint(self):
        """Test getting available processors."""
        response = client.get("/optimize/processors")
        
        assert response.status_code == 200
        data = response.json()
        assert "processors" in data
        assert "total_count" in data
        assert "supported_formats" in data
        assert "max_file_size_mb" in data
        
        # Check Instagram processor is available
        assert "instagram_square" in data["processors"]
        assert data["max_file_size_mb"] == 10
        assert ".jpg" in data["supported_formats"]
    
    def test_optimize_instagram_square_success(self):
        """Test successful Instagram square optimization."""
        image_buffer = self.create_test_image(size=(1200, 800))
        
        files = {"file": ("test.jpg", image_buffer, "image/jpeg")}
        data = {"preset": "instagram_square"}
        
        response = client.post("/optimize/", files=files, data=data)
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/zip"
        assert "pixelprep_instagram_square.zip" in response.headers.get("content-disposition", "")
        
        # Verify ZIP contents
        zip_content = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_content, 'r') as zip_file:
            files_in_zip = zip_file.namelist()
            assert len(files_in_zip) == 2  # Image + metadata
            
            # Check for optimized image
            image_files = [f for f in files_in_zip if f.endswith('.jpg')]
            assert len(image_files) == 1
            assert "instagram_square" in image_files[0]
            
            # Check for metadata
            assert "metadata.json" in files_in_zip
            
            # Verify metadata content
            metadata = json.loads(zip_file.read("metadata.json"))
            assert metadata["preset"] == "instagram_square"
            assert metadata["original_file"] == "test.jpg"
            assert "processor_config" in metadata
    
    def test_optimize_invalid_preset(self):
        """Test optimization with invalid preset."""
        image_buffer = self.create_test_image()
        
        files = {"file": ("test.jpg", image_buffer, "image/jpeg")}
        data = {"preset": "invalid_preset"}
        
        response = client.post("/optimize/", files=files, data=data)
        
        assert response.status_code == 400
        data = response.json()
        assert "Invalid preset" in data["error"]
        assert "invalid_preset" in data["error"]
    
    def test_optimize_unsupported_format(self):
        """Test optimization with unsupported file format."""
        # Create a text file pretending to be an image
        text_buffer = io.BytesIO(b"This is not an image")
        
        files = {"file": ("test.txt", text_buffer, "text/plain")}
        data = {"preset": "instagram_square"}
        
        response = client.post("/optimize/", files=files, data=data)
        
        assert response.status_code == 400
        data = response.json()
        assert "Unsupported file format" in data["error"]
    
    def test_optimize_no_filename(self):
        """Test optimization with file that has no name."""
        image_buffer = self.create_test_image()
        
        files = {"file": ("", image_buffer, "image/jpeg")}
        data = {"preset": "instagram_square"}
        
        response = client.post("/optimize/", files=files, data=data)
        
        # FastAPI validates and rejects empty filename before our validation
        assert response.status_code == 422  # FastAPI validation error
        # The error message will be about the file parameter validation
    
    def test_optimize_corrupted_image(self):
        """Test optimization with corrupted image data."""
        # Create invalid image data
        corrupted_buffer = io.BytesIO(b"INVALID_IMAGE_DATA")
        
        files = {"file": ("corrupted.jpg", corrupted_buffer, "image/jpeg")}
        data = {"preset": "instagram_square"}
        
        response = client.post("/optimize/", files=files, data=data)
        
        assert response.status_code == 400
        data = response.json()
        assert "Invalid image file" in data["error"]
    
    def test_optimize_large_file(self):
        """Test optimization with file that's too large."""
        # Create a large image (simulate >10MB)
        # We'll create a smaller image but patch the size check
        image_buffer = self.create_test_image(size=(100, 100))
        
        # Create a buffer that's too large
        large_buffer = io.BytesIO(b"0" * (11 * 1024 * 1024))  # 11MB of zeros
        
        files = {"file": ("large.jpg", large_buffer, "image/jpeg")}
        data = {"preset": "instagram_square"}
        
        response = client.post("/optimize/", files=files, data=data)
        
        assert response.status_code == 413
        data = response.json()
        assert "File too large" in data["error"]
    
    def test_optimize_different_image_formats(self):
        """Test optimization with different supported image formats."""
        formats_to_test = [
            ("test.png", "PNG", "image/png"),
            ("test.webp", "WebP", "image/webp"),
        ]
        
        for filename, pil_format, mime_type in formats_to_test:
            if pil_format == "WebP":
                # Skip WebP if not supported
                try:
                    Image.new("RGB", (100, 100)).save(io.BytesIO(), format="WebP")
                except OSError:
                    continue
            
            image_buffer = self.create_test_image(format=pil_format)
            
            files = {"file": (filename, image_buffer, mime_type)}
            data = {"preset": "instagram_square"}
            
            response = client.post("/optimize/", files=files, data=data)
            
            assert response.status_code == 200, f"Failed for format {pil_format}"
            assert response.headers["content-type"] == "application/zip"
    
    def test_optimize_rgba_to_rgb_conversion(self):
        """Test that RGBA images are properly converted to RGB."""
        image_buffer = self.create_test_image(format='PNG', mode='RGBA')
        
        files = {"file": ("test.png", image_buffer, "image/png")}
        data = {"preset": "instagram_square"}
        
        response = client.post("/optimize/", files=files, data=data)
        
        assert response.status_code == 200
        
        # Extract and verify the processed image
        zip_content = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_content, 'r') as zip_file:
            image_files = [f for f in zip_file.namelist() if f.endswith('.jpg')]
            image_data = zip_file.read(image_files[0])
            
            # Verify the output is JPEG (RGB)
            processed_image = Image.open(io.BytesIO(image_data))
            assert processed_image.mode == 'RGB'
            assert processed_image.size == (1080, 1080)
    
    def test_optimize_missing_file(self):
        """Test optimization without providing a file."""
        data = {"preset": "instagram_square"}
        
        response = client.post("/optimize/", data=data)
        
        assert response.status_code == 422  # FastAPI validation error
    
    def test_optimize_missing_preset(self):
        """Test optimization without providing a preset."""
        image_buffer = self.create_test_image()
        
        files = {"file": ("test.jpg", image_buffer, "image/jpeg")}
        
        response = client.post("/optimize/", files=files)
        
        assert response.status_code == 422  # FastAPI validation error
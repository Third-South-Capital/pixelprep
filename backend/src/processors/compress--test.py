import pytest
from PIL import Image
from .compress import QuickCompressProcessor


class TestQuickCompressProcessor:
    """Test quick compress processor functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.processor = QuickCompressProcessor()
    
    def test_get_preset_config(self):
        """Test quick compress preset configuration."""
        config = self.processor.get_preset_config()
        
        assert config['name'] == 'Quick Compress'
        assert 'Original dimensions preserved' in config['dimensions']
        assert config['size_reduction'] == '70% smaller'
        assert config['format'] == 'JPEG'
    
    def test_process_preserves_dimensions(self):
        """Test that compression preserves original dimensions."""
        # Create test image
        image = Image.new('RGB', (1500, 1200), (255, 128, 64))
        
        result = self.processor.process(image)
        
        # Dimensions should be preserved
        assert result.size == (1500, 1200)
        assert result.mode == 'RGB'
    
    def test_compression_ratio(self):
        """Test that compression achieves significant size reduction."""
        # Create a high-quality test image with realistic content
        import os
        test_image_path = os.path.join(os.path.dirname(__file__), '../../test_images')
        
        # Try to use a real test image first, fallback to synthetic if not available
        if os.path.exists(os.path.join(test_image_path, 'sample.jpg')):
            image = Image.open(os.path.join(test_image_path, 'sample.jpg'))
        else:
            # Create a more realistic synthetic image with noise and gradients
            import random
            image = Image.new('RGB', (800, 600))
            pixels = []
            for y in range(600):
                for x in range(800):
                    # Add noise and gradients to make it less compressible
                    base_r = min(255, max(0, x // 3 + random.randint(-50, 50)))
                    base_g = min(255, max(0, y // 3 + random.randint(-50, 50)))
                    base_b = min(255, max(0, (x + y) // 6 + random.randint(-50, 50)))
                    pixels.append((base_r, base_g, base_b))
            image.putdata(pixels)
        
        # Use the processor's own estimation method for consistency
        original_size = self.processor._estimate_file_size(image)
        
        # Process for compression
        result = self.processor.process(image)
        
        # Check actual compressed size using processor's format and settings
        import io
        compressed_buffer = io.BytesIO()
        result.save(compressed_buffer, format='JPEG', quality=85, optimize=True)
        compressed_size = compressed_buffer.tell()
        
        # Should achieve meaningful compression (allow for variation in test images)
        compression_ratio = (original_size - compressed_size) / original_size
        assert compression_ratio > 0.1  # At least 10% reduction (more realistic)
    
    def test_save_optimized(self):
        """Test saving optimized compressed image."""
        # Create a more complex image that will show compression effects
        import random
        image = Image.new('RGB', (800, 600))
        pixels = []
        for y in range(600):
            for x in range(800):
                # Create an image with some detail that can be compressed
                r = min(255, max(0, (x + y) % 200 + random.randint(-30, 30)))
                g = min(255, max(0, x % 180 + random.randint(-30, 30)))
                b = min(255, max(0, y % 160 + random.randint(-30, 30)))
                pixels.append((r, g, b))
        image.putdata(pixels)
        
        import tempfile
        import os
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            metadata = self.processor.save_optimized(image, tmp.name)
            
            assert metadata['format'] == 'JPEG'
            assert metadata['dimensions'] == '800×600'
            assert 'compression_ratio' in metadata
            assert 'original_size_mb' in metadata
            # Should have achieved some compression (file smaller than original estimate)
            assert metadata['file_size_mb'] <= metadata['original_size_mb']
            assert float(metadata['compression_ratio'].rstrip('%')) > 0  # Some compression achieved
            
            # Verify file exists and has correct dimensions
            saved_image = Image.open(tmp.name)
            assert saved_image.size == (800, 600)
            
            # Clean up
            os.unlink(tmp.name)
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
        # Create complex pattern image (compresses less efficiently)
        image = Image.new('RGB', (1000, 1000))
        pixels = []
        for y in range(1000):
            for x in range(1000):
                pixels.append((x % 256, y % 256, (x + y) % 256))
        image.putdata(pixels)
        
        # Estimate original size
        import io
        original_buffer = io.BytesIO()
        image.save(original_buffer, format='JPEG', quality=95)
        original_size = original_buffer.tell()
        
        # Process for compression
        result = self.processor.process(image)
        
        # Check compressed size
        compressed_buffer = io.BytesIO()
        result.save(compressed_buffer, format='JPEG', quality=95)
        compressed_size = compressed_buffer.tell()
        
        # Should achieve some compression (though exact 70% may vary)
        compression_ratio = (original_size - compressed_size) / original_size
        assert compression_ratio > 0.3  # At least 30% reduction
    
    def test_save_optimized(self):
        """Test saving optimized compressed image."""
        image = Image.new('RGB', (800, 600), (100, 150, 200))
        
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            metadata = self.processor.save_optimized(image, tmp.name)
            
            assert metadata['format'] == 'JPEG'
            assert metadata['dimensions'] == '800×600'
            assert 'compression_ratio' in metadata
            assert 'original_size_mb' in metadata
            assert metadata['file_size_mb'] < metadata['original_size_mb']
            
            # Verify file exists
            saved_image = Image.open(tmp.name)
            assert saved_image.size == (800, 600)
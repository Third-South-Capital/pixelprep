import pytest
from PIL import Image
from .web import WebDisplayProcessor


class TestWebDisplayProcessor:
    """Test web display processor functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.processor = WebDisplayProcessor()
    
    def test_get_preset_config(self):
        """Test web display preset configuration."""
        config = self.processor.get_preset_config()
        
        assert config['name'] == 'Web Display'
        assert '1920px wide' in config['dimensions']
        assert config['max_file_size'] == '<500KB'
        assert config['primary_format'] == 'WebP'
        assert config['fallback_format'] == 'JPEG'
    
    def test_process_wide_image(self):
        """Test processing wide image."""
        # Create wide image
        image = Image.new('RGB', (3000, 1500), (255, 128, 64))
        
        result = self.processor.process(image)
        
        # Should resize to 1920px wide
        assert result.size[0] == 1920
        assert result.mode == 'RGB'
        # Aspect ratio should be preserved
        original_ratio = 3000 / 1500
        result_ratio = result.size[0] / result.size[1]
        assert abs(original_ratio - result_ratio) < 0.01
    
    def test_process_narrow_image(self):
        """Test processing narrow image (width < 1920px)."""
        # Create narrow image
        image = Image.new('RGB', (1200, 800), (64, 255, 128))
        
        result = self.processor.process(image)
        
        # Should keep original size
        assert result.size == (1200, 800)
        assert result.mode == 'RGB'
    
    def test_save_optimized_jpeg(self):
        """Test saving optimized web image as JPEG."""
        image = Image.new('RGB', (1920, 1080), (100, 150, 200))
        
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            metadata = self.processor.save_optimized(image, tmp.name)
            
            assert metadata['format'] in ['JPEG', 'WebP']
            assert metadata['dimensions'] == '1920×1080'
            assert metadata['file_size_kb'] <= 500
            
            # Verify file exists
            saved_image = Image.open(tmp.name)
            assert saved_image.size == (1920, 1080)
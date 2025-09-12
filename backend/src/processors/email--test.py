import pytest
from PIL import Image
from .email import EmailNewsletterProcessor


class TestEmailNewsletterProcessor:
    """Test email newsletter processor functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.processor = EmailNewsletterProcessor()
    
    def test_get_preset_config(self):
        """Test email newsletter preset configuration."""
        config = self.processor.get_preset_config()
        
        assert config['name'] == 'Email Newsletter'
        assert '600px wide' in config['dimensions']
        assert config['max_file_size'] == '<200KB'
        assert config['format'] == 'JPEG'
    
    def test_process_wide_image(self):
        """Test processing wide image for email."""
        # Create wide image
        image = Image.new('RGB', (1200, 800), (255, 128, 64))
        
        result = self.processor.process(image)
        
        # Should resize to 600px wide
        assert result.size[0] == 600
        assert result.mode == 'RGB'
        # Aspect ratio should be preserved
        original_ratio = 1200 / 800
        result_ratio = result.size[0] / result.size[1]
        assert abs(original_ratio - result_ratio) < 0.01
    
    def test_process_small_image(self):
        """Test processing small image (width < 600px)."""
        # Create small image
        image = Image.new('RGB', (400, 300), (64, 255, 128))
        
        result = self.processor.process(image)
        
        # Should keep original size
        assert result.size == (400, 300)
        assert result.mode == 'RGB'
    
    def test_save_optimized(self):
        """Test saving optimized email image."""
        image = Image.new('RGB', (600, 400), (100, 150, 200))
        
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            metadata = self.processor.save_optimized(image, tmp.name)
            
            assert metadata['format'] == 'JPEG'
            assert metadata['dimensions'] == '600×400'
            assert metadata['file_size_kb'] <= 200
            assert metadata['email_friendly'] is True
            assert metadata['mobile_optimized'] is True
            
            # Verify file exists
            saved_image = Image.open(tmp.name)
            assert saved_image.size == (600, 400)
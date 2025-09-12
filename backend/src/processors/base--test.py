import pytest
from PIL import Image
from .base import BaseProcessor


class TestBaseProcessor:
    """Test the BaseProcessor utility methods."""
    
    def test_ensure_rgb_rgba_image(self):
        """Test converting RGBA image to RGB."""
        # Create RGBA image with transparency
        rgba_image = Image.new('RGBA', (100, 100), (255, 0, 0, 128))
        
        # Mock processor to access protected methods
        class MockProcessor(BaseProcessor):
            def process(self, image):
                return image
            def get_preset_config(self):
                return {}
        
        processor = MockProcessor()
        rgb_image = processor._ensure_rgb(rgba_image)
        
        assert rgb_image.mode == 'RGB'
        assert rgb_image.size == (100, 100)
    
    def test_ensure_rgb_already_rgb(self):
        """Test that RGB image is returned unchanged."""
        rgb_image = Image.new('RGB', (100, 100), (255, 0, 0))
        
        class MockProcessor(BaseProcessor):
            def process(self, image):
                return image
            def get_preset_config(self):
                return {}
        
        processor = MockProcessor()
        result = processor._ensure_rgb(rgb_image)
        
        assert result.mode == 'RGB'
        assert result.size == (100, 100)
        assert result is rgb_image  # Same object
    
    def test_smart_crop_landscape_to_square(self):
        """Test cropping landscape image to square."""
        # Create 200x100 landscape image
        image = Image.new('RGB', (200, 100), (255, 0, 0))
        
        class MockProcessor(BaseProcessor):
            def process(self, image):
                return image
            def get_preset_config(self):
                return {}
        
        processor = MockProcessor()
        cropped = processor._smart_crop(image, 100, 100)
        
        assert cropped.size == (100, 100)
    
    def test_smart_crop_portrait_to_square(self):
        """Test cropping portrait image to square."""
        # Create 100x200 portrait image
        image = Image.new('RGB', (100, 200), (0, 255, 0))
        
        class MockProcessor(BaseProcessor):
            def process(self, image):
                return image
            def get_preset_config(self):
                return {}
        
        processor = MockProcessor()
        cropped = processor._smart_crop(image, 100, 100)
        
        assert cropped.size == (100, 100)
    
    def test_resize_with_quality(self):
        """Test high quality image resizing."""
        image = Image.new('RGB', (500, 300), (0, 0, 255))
        
        class MockProcessor(BaseProcessor):
            def process(self, image):
                return image
            def get_preset_config(self):
                return {}
        
        processor = MockProcessor()
        resized = processor._resize_with_quality(image, 250, 150)
        
        assert resized.size == (250, 150)
    
    def test_abstract_methods_must_be_implemented(self):
        """Test that abstract methods must be implemented."""
        with pytest.raises(TypeError):
            BaseProcessor()
from PIL import Image

from .custom import CustomProcessor, create_custom_processor


class TestCustomProcessor:
    """Test custom processor functionality."""

    def test_custom_square_processor(self):
        """Test custom processor with square dimensions."""
        processor = CustomProcessor(800, 800, 2.0, 'JPEG')

        # Create test image
        image = Image.new('RGB', (1200, 900), (255, 128, 64))

        result = processor.process(image)

        assert result.size == (800, 800)
        assert result.mode == 'RGB'

    def test_custom_processor_config(self):
        """Test custom processor configuration."""
        processor = CustomProcessor(1024, 768, 3.0, 'JPEG')
        config = processor.get_preset_config()

        assert config['name'] == 'Custom'
        assert '1024×768px' in config['description']
        assert config['dimensions'] == '1024×768px'
        assert config['max_file_size'] == '<3.0MB'
        assert config['format'] == 'JPEG'
        assert config['customizable'] is True

    def test_factory_function(self):
        """Test custom processor factory function."""
        processor = create_custom_processor(640, 480, 1.5, 'PNG')

        assert processor.target_width == 640
        assert processor.target_height == 480
        assert processor.max_size_mb == 1.5
        assert processor.format == 'PNG'

    def test_different_formats(self):
        """Test custom processor with different formats."""
        formats_to_test = ['JPEG', 'PNG']

        for format_type in formats_to_test:
            processor = CustomProcessor(500, 500, 2.0, format_type)
            image = Image.new('RGB', (800, 800), (100, 150, 200))

            result = processor.process(image)

            assert result.size == (500, 500)
            assert processor.format == format_type

    def test_save_optimized(self):
        """Test saving custom optimized image."""
        processor = CustomProcessor(600, 400, 1.0, 'JPEG')
        image = Image.new('RGB', (600, 400), (100, 150, 200))

        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            metadata = processor.save_optimized(image, tmp.name)

            assert metadata['format'] == 'JPEG'
            assert metadata['dimensions'] == '600×400'
            assert metadata['custom_width'] == 600
            assert metadata['custom_height'] == 400
            assert metadata['max_size_mb'] == 1.0
            assert metadata['file_size_mb'] <= 1.0

            # Verify file exists
            saved_image = Image.open(tmp.name)
            assert saved_image.size == (600, 400)

    def test_aspect_ratio_handling(self):
        """Test custom processor handles different aspect ratios."""
        processor = CustomProcessor(1000, 500, 2.0, 'JPEG')  # 2:1 ratio

        # Test with different input aspect ratio
        image = Image.new('RGB', (1200, 1200), (255, 0, 0))  # Square

        result = processor.process(image)

        assert result.size == (1000, 500)
        assert result.mode == 'RGB'

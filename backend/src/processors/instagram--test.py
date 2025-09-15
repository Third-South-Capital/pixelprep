import io
import tempfile

from PIL import Image

from .instagram import InstagramSquareProcessor


class TestInstagramSquareProcessor:
    """Test Instagram square processor functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.processor = InstagramSquareProcessor()

    def test_get_preset_config(self):
        """Test preset configuration retrieval."""
        config = self.processor.get_preset_config()

        assert config['name'] == 'Instagram Square'
        assert config['dimensions'] == '1080×1080px'
        assert config['max_file_size'] == '<4MB'
        assert config['format'] == 'JPEG'
        assert config['color_space'] == 'sRGB'
        assert config['aspect_ratio'] == '1:1'

    def test_process_square_image(self):
        """Test processing already square image."""
        # Create square RGB image
        image = Image.new('RGB', (2000, 2000), (255, 0, 0))

        result = self.processor.process(image)

        assert result.size == (1080, 1080)
        assert result.mode == 'RGB'

    def test_process_landscape_image(self):
        """Test processing landscape image with smart cropping."""
        # Create landscape image (wider than tall)
        image = Image.new('RGB', (2000, 1000), (0, 255, 0))

        result = self.processor.process(image)

        assert result.size == (1080, 1080)
        assert result.mode == 'RGB'

    def test_process_portrait_image(self):
        """Test processing portrait image with smart cropping."""
        # Create portrait image (taller than wide)
        image = Image.new('RGB', (1000, 2000), (0, 0, 255))

        result = self.processor.process(image)

        assert result.size == (1080, 1080)
        assert result.mode == 'RGB'

    def test_process_rgba_image(self):
        """Test processing RGBA image converts to RGB."""
        # Create RGBA image with transparency
        image = Image.new('RGBA', (1500, 1500), (255, 0, 0, 128))

        result = self.processor.process(image)

        assert result.size == (1080, 1080)
        assert result.mode == 'RGB'

    def test_process_small_image_upscales(self):
        """Test that small images are upscaled to target size."""
        # Create small square image
        image = Image.new('RGB', (500, 500), (255, 255, 0))

        result = self.processor.process(image)

        assert result.size == (1080, 1080)
        assert result.mode == 'RGB'

    def test_optimize_file_size(self):
        """Test file size optimization."""
        # Create large image that will need compression
        image = Image.new('RGB', (1080, 1080))

        # Fill with complex pattern to increase file size
        pixels = []
        for y in range(1080):
            for x in range(1080):
                pixels.append((x % 256, y % 256, (x + y) % 256))
        image.putdata(pixels)

        optimized = self.processor.optimize_file_size(image, max_size_bytes=4*1024*1024)

        assert optimized.size == (1080, 1080)
        assert optimized.mode == 'RGB'

        # Test that optimized image can be saved within size limits
        buffer = io.BytesIO()
        optimized.save(buffer, format='JPEG', quality=95, optimize=True)
        file_size_mb = buffer.tell() / (1024 * 1024)

        assert file_size_mb <= 4.0

    def test_save_optimized(self):
        """Test saving optimized image with metadata."""
        image = Image.new('RGB', (1080, 1080), (128, 128, 128))

        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            metadata = self.processor.save_optimized(image, tmp.name)

            assert metadata['file_path'] == tmp.name
            assert metadata['file_size_mb'] <= 4.0
            assert metadata['dimensions'] == '1080×1080'
            assert metadata['format'] == 'JPEG'
            assert 60 <= metadata['quality'] <= 95

            # Verify file exists and can be opened
            saved_image = Image.open(tmp.name)
            assert saved_image.size == (1080, 1080)

    def test_process_various_formats(self):
        """Test processing different input formats."""
        formats_to_test = [
            ('RGB', (1200, 1200), None),
            ('RGBA', (1200, 1200), None),
            ('L', (1200, 1200), None),  # Grayscale
            ('P', (1200, 1200), None),  # Palette mode
        ]

        for mode, size, color in formats_to_test:
            if color is None:
                if mode == 'RGB':
                    color = (255, 0, 0)
                elif mode == 'RGBA':
                    color = (255, 0, 0, 128)
                else:
                    color = 128 if mode == 'L' else 1

            image = Image.new(mode, size, color)

            result = self.processor.process(image)

            assert result.size == (1080, 1080)
            assert result.mode == 'RGB'

    def test_extreme_aspect_ratios(self):
        """Test processing images with extreme aspect ratios."""
        # Very wide image
        wide_image = Image.new('RGB', (4000, 1000), (255, 0, 0))
        result = self.processor.process(wide_image)
        assert result.size == (1080, 1080)

        # Very tall image
        tall_image = Image.new('RGB', (1000, 4000), (0, 255, 0))
        result = self.processor.process(tall_image)
        assert result.size == (1080, 1080)

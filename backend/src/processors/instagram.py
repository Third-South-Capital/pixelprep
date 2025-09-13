import io
import logging
from typing import Any

from PIL import Image, ImageFile

from .base import BaseProcessor

# Set up logging for detailed file size tracking
logger = logging.getLogger(__name__)

# Allow loading of truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True


class InstagramSquareProcessor(BaseProcessor):
    """Processor for Instagram square format: 1080×1080px, <4MB, JPEG, sRGB."""

    TARGET_WIDTH = 1080
    TARGET_HEIGHT = 1080
    MAX_FILE_SIZE_MB = 4
    FORMAT = 'JPEG'
    QUALITY_START = 95
    QUALITY_MIN = 60

    def process(self, image: Image.Image) -> Image.Image:
        """
        Process image for Instagram square format.

        Args:
            image: Input PIL Image

        Returns:
            Processed PIL Image optimized for Instagram
        """
        logger.info("=== INSTAGRAM SQUARE PROCESSING START ===")

        # Log initial image details
        initial_size = self._get_image_memory_size(image)
        logger.info(f"Initial PIL image: size={image.size}, mode={image.mode}, format={image.format}")
        logger.info(f"Initial PIL memory size: {initial_size} bytes ({initial_size/1024:.1f} KB)")

        # Ensure RGB mode for JPEG output
        image = self._ensure_rgb(image)
        rgb_size = self._get_image_memory_size(image)
        logger.info(f"After RGB conversion: mode={image.mode}, memory_size={rgb_size} bytes ({rgb_size/1024:.1f} KB)")

        # Smart crop to square aspect ratio if needed
        current_width, current_height = image.size
        if current_width != current_height:
            logger.info(f"Cropping from {current_width}x{current_height} to square aspect ratio")
            image = self._smart_crop(image, self.TARGET_WIDTH, self.TARGET_HEIGHT)
            crop_size = self._get_image_memory_size(image)
            logger.info(f"After crop: size={image.size}, memory_size={crop_size} bytes ({crop_size/1024:.1f} KB)")

        # Resize to target dimensions
        if image.size != (self.TARGET_WIDTH, self.TARGET_HEIGHT):
            logger.info(f"Resizing from {image.size} to {self.TARGET_WIDTH}x{self.TARGET_HEIGHT}")
            image = self._resize_with_quality(image, self.TARGET_WIDTH, self.TARGET_HEIGHT)
            resize_size = self._get_image_memory_size(image)
            logger.info(f"After resize: size={image.size}, memory_size={resize_size} bytes ({resize_size/1024:.1f} KB)")

        # Optimize file size while maintaining quality
        logger.info("Starting file size optimization...")
        optimized_image = self._optimize_file_size(image)
        final_size = self._get_image_memory_size(optimized_image)
        logger.info(f"Final optimized PIL image: memory_size={final_size} bytes ({final_size/1024:.1f} KB)")

        logger.info("=== INSTAGRAM SQUARE PROCESSING END ===")
        return optimized_image

    def get_preset_config(self) -> dict[str, Any]:
        """Get Instagram square preset configuration."""
        return {
            'name': 'Instagram Square',
            'description': 'Optimized for Instagram square posts',
            'dimensions': f'{self.TARGET_WIDTH}×{self.TARGET_HEIGHT}px',
            'max_file_size': f'<{self.MAX_FILE_SIZE_MB}MB',
            'format': self.FORMAT,
            'color_space': 'sRGB',
            'aspect_ratio': '1:1',
            'use_case': 'Social media posts, portfolio sharing, engagement'
        }

    def _optimize_file_size(self, image: Image.Image) -> Image.Image:
        """
        Optimize image file size to meet Instagram requirements.

        Args:
            image: PIL Image to optimize

        Returns:
            Optimized PIL Image
        """
        max_size_bytes = self.MAX_FILE_SIZE_MB * 1024 * 1024
        quality = self.QUALITY_START
        logger.info(f"Target max file size: {max_size_bytes} bytes ({max_size_bytes/1024:.1f} KB)")
        logger.info(f"Starting quality optimization at Q={quality}")

        attempt = 1
        while quality >= self.QUALITY_MIN:
            # Save to bytes to check file size
            output_buffer = io.BytesIO()

            # Save with current quality
            save_kwargs = {
                'format': self.FORMAT,
                'quality': quality,
                'optimize': True,
                'progressive': True
            }

            image.save(output_buffer, **save_kwargs)
            file_size = output_buffer.tell()

            logger.info(f"Attempt {attempt}: Quality={quality}, JPEG bytes={file_size} ({file_size/1024:.1f} KB)")

            # If file size is acceptable, return the image
            if file_size <= max_size_bytes:
                logger.info(f"✓ File size acceptable at Q={quality}: {file_size} bytes ({file_size/1024:.1f} KB)")
                output_buffer.seek(0)
                final_image = Image.open(output_buffer)
                logger.info(f"Final optimized image loaded: size={final_image.size}, mode={final_image.mode}")
                return final_image

            # Reduce quality and try again
            logger.info(f"✗ File size {file_size} > {max_size_bytes}, reducing quality...")
            quality -= 5
            attempt += 1

        # If we can't meet size requirements, return with minimum quality
        logger.warning(f"Could not meet size requirements, using minimum quality {self.QUALITY_MIN}")
        output_buffer = io.BytesIO()
        image.save(output_buffer, format=self.FORMAT, quality=self.QUALITY_MIN, optimize=True)
        final_size = output_buffer.tell()
        logger.info(f"Final fallback: Q={self.QUALITY_MIN}, JPEG bytes={final_size} ({final_size/1024:.1f} KB)")
        output_buffer.seek(0)
        return Image.open(output_buffer)

    def save_optimized(self, image: Image.Image, output_path: str) -> dict[str, Any]:
        """
        Save optimized image and return metadata.

        Args:
            image: Processed PIL Image
            output_path: Path to save the image

        Returns:
            Dictionary with save metadata
        """
        logger.info("=== SAVE_OPTIMIZED START ===")
        logger.info(f"Saving to: {output_path}")

        # Get optimal quality for file size
        max_size_bytes = self.MAX_FILE_SIZE_MB * 1024 * 1024
        quality = self.QUALITY_START
        final_quality = quality

        logger.info(f"Finding optimal quality for file size <= {max_size_bytes} bytes")

        while quality >= self.QUALITY_MIN:
            test_buffer = io.BytesIO()
            image.save(test_buffer, format=self.FORMAT, quality=quality, optimize=True)
            test_size = test_buffer.tell()
            logger.info(f"Test save Q={quality}: {test_size} bytes ({test_size/1024:.1f} KB)")

            if test_size <= max_size_bytes:
                final_quality = quality
                logger.info(f"✓ Found optimal quality: Q={final_quality}")
                break
            quality -= 5

        # Save with optimal quality
        save_kwargs = {
            'format': self.FORMAT,
            'quality': final_quality,
            'optimize': True,
            'progressive': True
        }

        logger.info(f"Saving with final settings: Q={final_quality}, format={self.FORMAT}")
        image.save(output_path, **save_kwargs)

        # Return metadata
        import os
        file_size = os.path.getsize(output_path)
        logger.info(f"Final saved file size: {file_size} bytes ({file_size/1024:.1f} KB)")

        metadata = {
            'file_path': output_path,
            'file_size_bytes': file_size,
            'file_size_mb': round(file_size / (1024 * 1024), 2),
            'quality': final_quality,
            'dimensions': f'{image.size[0]}×{image.size[1]}',
            'format': self.FORMAT
        }

        logger.info(f"Metadata: {metadata}")
        logger.info("=== SAVE_OPTIMIZED END ===")
        return metadata

    def get_compression_params(self, quality: int = 95) -> dict[str, Any]:
        """Get Instagram-specific compression parameters."""
        return {
            'format': self.FORMAT,
            'quality': quality,
            'optimize': True,
            'progressive': True
        }

    def _get_image_memory_size(self, image: Image.Image) -> int:
        """
        Calculate the approximate memory size of a PIL Image.

        Args:
            image: PIL Image

        Returns:
            Approximate memory size in bytes
        """
        width, height = image.size
        mode = image.mode

        # Calculate bytes per pixel based on mode
        mode_bytes = {
            'L': 1,     # Grayscale
            'P': 1,     # Palette
            'RGB': 3,   # RGB
            'RGBA': 4,  # RGBA
            'CMYK': 4,  # CMYK
            'YCbCr': 3, # YCbCr
            'LAB': 3,   # LAB
            'HSV': 3,   # HSV
        }

        bytes_per_pixel = mode_bytes.get(mode, 3)  # Default to RGB
        return width * height * bytes_per_pixel

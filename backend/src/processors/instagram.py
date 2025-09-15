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
        initial_size = self.get_image_memory_size(image)
        logger.info(f"Initial PIL image: size={image.size}, mode={image.mode}, format={image.format}")
        logger.info(f"Initial PIL memory size: {initial_size} bytes ({initial_size/1024:.1f} KB)")

        # Ensure RGB mode for JPEG output
        image = self._ensure_rgb(image)
        rgb_size = self.get_image_memory_size(image)
        logger.info(f"After RGB conversion: mode={image.mode}, memory_size={rgb_size} bytes ({rgb_size/1024:.1f} KB)")

        # Smart crop to square aspect ratio if needed
        current_width, current_height = image.size
        if current_width != current_height:
            logger.info(f"Cropping from {current_width}x{current_height} to square aspect ratio")
            image = self._smart_crop(image, self.TARGET_WIDTH, self.TARGET_HEIGHT)
            crop_size = self.get_image_memory_size(image)
            logger.info(f"After crop: size={image.size}, memory_size={crop_size} bytes ({crop_size/1024:.1f} KB)")

        # Resize to target dimensions
        if image.size != (self.TARGET_WIDTH, self.TARGET_HEIGHT):
            logger.info(f"Resizing from {image.size} to {self.TARGET_WIDTH}x{self.TARGET_HEIGHT}")
            image = self._resize_with_quality(image, self.TARGET_WIDTH, self.TARGET_HEIGHT)
            resize_size = self.get_image_memory_size(image)
            logger.info(f"After resize: size={image.size}, memory_size={resize_size} bytes ({resize_size/1024:.1f} KB)")

        # Processing complete - optimization will happen during save
        final_size = self.get_image_memory_size(image)
        logger.info(f"Final processed PIL image: memory_size={final_size} bytes ({final_size/1024:.1f} KB)")
        logger.info("File size optimization will be performed during save...")

        logger.info("=== INSTAGRAM SQUARE PROCESSING END ===")
        return image

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

        max_size_bytes = self.MAX_FILE_SIZE_MB * 1024 * 1024
        metadata = self.save_optimized_with_metadata(
            image=image,
            output_path=output_path,
            max_size_bytes=max_size_bytes,
            format_type=self.FORMAT,
            quality_start=self.QUALITY_START,
            quality_min=self.QUALITY_MIN,
            progressive=True
        )

        logger.info("=== SAVE_OPTIMIZED END ===")
        return metadata

    def get_compression_params(self, quality: int = 95) -> dict[str, Any]:
        """Get Instagram-specific compression parameters."""
        return super().get_compression_params(quality=quality, format_type=self.FORMAT)

import io
from typing import Any

from PIL import Image, ImageFile

from .base import BaseProcessor

# Allow loading of truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True


class EmailNewsletterProcessor(BaseProcessor):
    """Processor for email newsletter format: 600px wide, <200KB, JPEG."""

    TARGET_WIDTH = 600
    MAX_FILE_SIZE_KB = 200
    FORMAT = 'JPEG'
    QUALITY_START = 85
    QUALITY_MIN = 40

    def process(self, image: Image.Image) -> Image.Image:
        """
        Process image for email newsletter format.
        
        Args:
            image: Input PIL Image
            
        Returns:
            Processed PIL Image optimized for email newsletters
        """
        # Fix orientation and ensure RGB mode for JPEG output
        image = self._fix_orientation_and_ensure_rgb(image)

        # Resize to target width while preserving aspect ratio
        resized_image = self._resize_to_width(image, self.TARGET_WIDTH)

        # Optimize file size for email delivery
        optimized_image = self._optimize_for_email(resized_image)

        return optimized_image

    def get_preset_config(self) -> dict[str, Any]:
        """Get email newsletter preset configuration."""
        return {
            'name': 'Email Newsletter',
            'description': 'Optimized for email newsletters and marketing campaigns',
            'dimensions': f'{self.TARGET_WIDTH}px wide (height auto)',
            'max_file_size': f'<{self.MAX_FILE_SIZE_KB}KB',
            'format': self.FORMAT,
            'aspect_ratio': 'Preserved',
            'use_case': 'Email marketing, newsletters, mobile-friendly delivery'
        }

    def _resize_to_width(self, image: Image.Image, target_width: int) -> Image.Image:
        """
        Resize image to target width while preserving aspect ratio.
        """
        current_width, current_height = image.size

        # If already smaller than target width, return as-is
        if current_width <= target_width:
            return image

        # Calculate new height maintaining aspect ratio
        aspect_ratio = current_height / current_width
        new_height = int(target_width * aspect_ratio)

        return self._resize_with_quality(image, target_width, new_height)

    def _optimize_for_email(self, image: Image.Image) -> Image.Image:
        """
        Optimize image for email delivery with strict size constraints.
        
        Args:
            image: PIL Image to optimize
            
        Returns:
            Optimized PIL Image
        """
        max_size_bytes = self.MAX_FILE_SIZE_KB * 1024
        quality = self.QUALITY_START

        while quality >= self.QUALITY_MIN:
            output_buffer = io.BytesIO()

            # Save with current quality, optimized for email
            save_kwargs = {
                'format': self.FORMAT,
                'quality': quality,
                'optimize': True,
                'progressive': False  # Progressive JPEGs can be problematic in email
            }

            image.save(output_buffer, **save_kwargs)
            file_size = output_buffer.tell()

            # If file size is acceptable, return the image
            if file_size <= max_size_bytes:
                output_buffer.seek(0)
                return Image.open(output_buffer)

            # Reduce quality and try again
            quality -= 5

        # If we can't meet size requirements, return with minimum quality
        output_buffer = io.BytesIO()
        image.save(
            output_buffer,
            format=self.FORMAT,
            quality=self.QUALITY_MIN,
            optimize=True,
            progressive=False
        )
        output_buffer.seek(0)
        return Image.open(output_buffer)

    def save_optimized(self, image: Image.Image, output_path: str) -> dict[str, Any]:
        """
        Save optimized image for email newsletter and return metadata.
        
        Args:
            image: Processed PIL Image
            output_path: Path to save the image
            
        Returns:
            Dictionary with save metadata
        """
        # Find optimal quality for target file size
        max_size_bytes = self.MAX_FILE_SIZE_KB * 1024
        quality = self.QUALITY_START
        final_quality = quality

        while quality >= self.QUALITY_MIN:
            test_buffer = io.BytesIO()
            image.save(
                test_buffer,
                format=self.FORMAT,
                quality=quality,
                optimize=True,
                progressive=False
            )
            file_size = test_buffer.tell()

            if file_size <= max_size_bytes:
                final_quality = quality
                break
            quality -= 5

        # Save with optimal settings
        save_kwargs = {
            'format': self.FORMAT,
            'quality': final_quality,
            'optimize': True,
            'progressive': False  # Better email compatibility
        }

        image.save(output_path, **save_kwargs)

        # Return metadata
        import os
        file_size = os.path.getsize(output_path)
        return {
            'file_path': output_path,
            'file_size_bytes': file_size,
            'file_size_kb': round(file_size / 1024, 1),
            'quality': final_quality,
            'dimensions': f'{image.size[0]}×{image.size[1]}',
            'format': self.FORMAT,
            'meets_email_requirements': file_size <= max_size_bytes,
            'email_friendly': True,  # Non-progressive JPEG
            'mobile_optimized': image.size[0] <= self.TARGET_WIDTH
        }

    def get_compression_params(self, quality: int = 85) -> dict[str, Any]:
        """Get email newsletter-specific compression parameters."""
        return {
            'format': self.FORMAT,
            'quality': quality,
            'optimize': True,
            'progressive': False  # Better email compatibility
        }

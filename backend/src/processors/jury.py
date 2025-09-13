import io
from typing import Any

from PIL import Image, ImageFile

from .base import BaseProcessor

# Allow loading of truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True


class JurySubmissionProcessor(BaseProcessor):
    """Processor for jury submission format: 1920px longest side, 1-2MB, JPEG, 72-300 DPI."""

    TARGET_MAX_DIMENSION = 1920
    MIN_FILE_SIZE_MB = 1
    MAX_FILE_SIZE_MB = 2
    FORMAT = 'JPEG'
    QUALITY_START = 95
    QUALITY_MIN = 60
    DPI_RANGE = (72, 300)

    def process(self, image: Image.Image) -> Image.Image:
        """
        Process image for jury submission format.
        
        Args:
            image: Input PIL Image
            
        Returns:
            Processed PIL Image optimized for jury submissions
        """
        # Ensure RGB mode for JPEG output
        image = self._ensure_rgb(image)

        # Resize to fit within max dimension while preserving aspect ratio
        resized_image = self._resize_to_max_dimension(image, self.TARGET_MAX_DIMENSION)

        # Optimize file size to meet jury requirements (1-2MB)
        optimized_image = self._optimize_for_jury_size(resized_image)

        return optimized_image

    def get_preset_config(self) -> dict[str, Any]:
        """Get jury submission preset configuration."""
        return {
            'name': 'Jury Submission',
            'description': 'Optimized for art competition and jury submissions',
            'max_dimension': f'{self.TARGET_MAX_DIMENSION}px longest side',
            'file_size_range': f'{self.MIN_FILE_SIZE_MB}-{self.MAX_FILE_SIZE_MB}MB',
            'format': self.FORMAT,
            'dpi_range': f'{self.DPI_RANGE[0]}-{self.DPI_RANGE[1]} DPI',
            'aspect_ratio': 'Preserved',
            'use_case': 'Art competitions, portfolio submissions, professional review'
        }

    def _resize_to_max_dimension(self, image: Image.Image, max_dimension: int) -> Image.Image:
        """
        Resize image so the longest side is max_dimension pixels.
        Preserves aspect ratio.
        """
        width, height = image.size
        longest_side = max(width, height)

        # If already smaller than max dimension, return as-is
        if longest_side <= max_dimension:
            return image

        # Calculate scaling factor
        scale_factor = max_dimension / longest_side
        new_width = int(width * scale_factor)
        new_height = int(height * scale_factor)

        return self._resize_with_quality(image, new_width, new_height)

    def _optimize_for_jury_size(self, image: Image.Image) -> Image.Image:
        """
        Optimize image file size to meet jury submission requirements (1-2MB).
        
        Args:
            image: PIL Image to optimize
            
        Returns:
            Optimized PIL Image
        """
        min_size_bytes = self.MIN_FILE_SIZE_MB * 1024 * 1024
        max_size_bytes = self.MAX_FILE_SIZE_MB * 1024 * 1024
        quality = self.QUALITY_START

        # First, try to find a quality that gives us a file size in the target range
        while quality >= self.QUALITY_MIN:
            # Save to bytes to check file size
            output_buffer = io.BytesIO()

            # Save with current quality and reasonable DPI
            save_kwargs = {
                'format': self.FORMAT,
                'quality': quality,
                'optimize': True,
                'dpi': (150, 150)  # Mid-range DPI suitable for most jury submissions
            }

            image.save(output_buffer, **save_kwargs)
            file_size = output_buffer.tell()

            # If file size is in acceptable range, return the image
            if min_size_bytes <= file_size <= max_size_bytes:
                output_buffer.seek(0)
                return Image.open(output_buffer)

            # If file is too small, increase quality or break
            if file_size < min_size_bytes and quality == self.QUALITY_START:
                # File is naturally small, return with high quality
                output_buffer.seek(0)
                return Image.open(output_buffer)

            # If file is too large, reduce quality
            if file_size > max_size_bytes:
                quality -= 5
            else:
                break

        # If we can't get into the ideal range, return with the best quality we can
        output_buffer = io.BytesIO()
        final_quality = max(quality, self.QUALITY_MIN)
        image.save(
            output_buffer,
            format=self.FORMAT,
            quality=final_quality,
            optimize=True,
            dpi=(150, 150)
        )
        output_buffer.seek(0)
        return Image.open(output_buffer)

    def save_optimized(self, image: Image.Image, output_path: str) -> dict[str, Any]:
        """
        Save optimized image for jury submission and return metadata.
        
        Args:
            image: Processed PIL Image
            output_path: Path to save the image
            
        Returns:
            Dictionary with save metadata
        """
        # Find optimal quality for target file size range
        min_size_bytes = self.MIN_FILE_SIZE_MB * 1024 * 1024
        max_size_bytes = self.MAX_FILE_SIZE_MB * 1024 * 1024
        quality = self.QUALITY_START
        final_quality = quality
        final_dpi = 150

        while quality >= self.QUALITY_MIN:
            test_buffer = io.BytesIO()
            image.save(
                test_buffer,
                format=self.FORMAT,
                quality=quality,
                optimize=True,
                dpi=(final_dpi, final_dpi)
            )
            file_size = test_buffer.tell()

            if min_size_bytes <= file_size <= max_size_bytes:
                final_quality = quality
                break
            elif file_size > max_size_bytes:
                quality -= 5
            else:
                final_quality = quality
                break

        # Save with optimal settings
        save_kwargs = {
            'format': self.FORMAT,
            'quality': final_quality,
            'optimize': True,
            'dpi': (final_dpi, final_dpi)
        }

        image.save(output_path, **save_kwargs)

        # Return metadata
        import os
        file_size = os.path.getsize(output_path)
        return {
            'file_path': output_path,
            'file_size_bytes': file_size,
            'file_size_mb': round(file_size / (1024 * 1024), 2),
            'quality': final_quality,
            'dimensions': f'{image.size[0]}×{image.size[1]}',
            'format': self.FORMAT,
            'dpi': final_dpi,
            'meets_jury_requirements': min_size_bytes <= file_size <= max_size_bytes
        }

    def get_compression_params(self, quality: int = 95) -> dict[str, Any]:
        """Get jury submission-specific compression parameters."""
        return {
            'format': self.FORMAT,
            'quality': quality,
            'optimize': True,
            'dpi': (150, 150)  # Mid-range DPI for jury submissions
        }

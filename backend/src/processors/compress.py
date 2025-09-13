import io
from typing import Any

from PIL import Image, ImageFile

from .base import BaseProcessor

# Allow loading of truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True


class QuickCompressProcessor(BaseProcessor):
    """Processor for quick compression: Keep dimensions, reduce filesize by 70%."""

    TARGET_REDUCTION_PERCENT = 70
    FORMAT = 'JPEG'
    QUALITY_START = 95
    QUALITY_MIN = 30
    MAX_ITERATIONS = 20

    def process(self, image: Image.Image) -> Image.Image:
        """
        Process image for quick compression while maintaining dimensions.
        
        Args:
            image: Input PIL Image
            
        Returns:
            Processed PIL Image with reduced file size
        """
        # Ensure RGB mode for JPEG output (most efficient compression)
        image = self._ensure_rgb(image)

        # Get original file size estimate
        original_size = self._estimate_file_size(image)
        target_size = original_size * (1 - self.TARGET_REDUCTION_PERCENT / 100)

        # Compress to target size while keeping original dimensions
        compressed_image = self._compress_to_target_size(image, target_size)

        return compressed_image

    def get_preset_config(self) -> dict[str, Any]:
        """Get quick compress preset configuration."""
        return {
            'name': 'Quick Compress',
            'description': 'Reduce file size by 70% while keeping original dimensions',
            'dimensions': 'Original dimensions preserved',
            'size_reduction': f'{self.TARGET_REDUCTION_PERCENT}% smaller',
            'format': self.FORMAT,
            'aspect_ratio': 'Preserved',
            'use_case': 'Storage optimization, faster uploads, bandwidth saving'
        }

    def _estimate_file_size(self, image: Image.Image) -> int:
        """
        Estimate original file size by saving at high quality.
        
        Args:
            image: PIL Image
            
        Returns:
            Estimated file size in bytes
        """
        buffer = io.BytesIO()
        image.save(buffer, format=self.FORMAT, quality=95, optimize=True)
        return buffer.tell()

    def _compress_to_target_size(self, image: Image.Image, target_size: int) -> Image.Image:
        """
        Compress image to approximately target file size.
        
        Args:
            image: PIL Image to compress
            target_size: Target file size in bytes
            
        Returns:
            Compressed PIL Image
        """
        quality = self.QUALITY_START
        best_quality = quality
        best_size_diff = float('inf')
        iterations = 0

        while quality >= self.QUALITY_MIN and iterations < self.MAX_ITERATIONS:
            output_buffer = io.BytesIO()

            # Save with current quality
            save_kwargs = {
                'format': self.FORMAT,
                'quality': quality,
                'optimize': True,
                'progressive': True if quality > 60 else False  # Progressive for higher quality
            }

            image.save(output_buffer, **save_kwargs)
            current_size = output_buffer.tell()

            # Calculate how close we are to target
            size_diff = abs(current_size - target_size)

            # If this is closer to target than previous attempts, save it
            if size_diff < best_size_diff:
                best_quality = quality
                best_size_diff = size_diff

            # If we're very close to target or under target, use this quality
            if current_size <= target_size * 1.1:  # Within 10% of target
                best_quality = quality
                break

            # Adjust quality based on how far we are from target
            if current_size > target_size * 1.5:
                quality -= 10  # Large reduction if way over
            elif current_size > target_size * 1.2:
                quality -= 7   # Medium reduction
            else:
                quality -= 3   # Small reduction if close

            iterations += 1

        # Generate final compressed image with best quality found
        output_buffer = io.BytesIO()
        save_kwargs = {
            'format': self.FORMAT,
            'quality': best_quality,
            'optimize': True,
            'progressive': True if best_quality > 60 else False
        }

        image.save(output_buffer, **save_kwargs)
        output_buffer.seek(0)
        return Image.open(output_buffer)

    def save_optimized(self, image: Image.Image, output_path: str) -> dict[str, Any]:
        """
        Save compressed image and return metadata with compression stats.
        
        Args:
            image: Processed PIL Image
            output_path: Path to save the image
            
        Returns:
            Dictionary with save metadata including compression ratio
        """
        # Estimate original size for comparison
        original_size_estimate = self._estimate_file_size(image)

        # Find the quality that gives us the best compression ratio
        target_size = original_size_estimate * (1 - self.TARGET_REDUCTION_PERCENT / 100)

        quality = self.QUALITY_START
        final_quality = quality
        best_compression_ratio = 0

        while quality >= self.QUALITY_MIN:
            test_buffer = io.BytesIO()
            save_kwargs = {
                'format': self.FORMAT,
                'quality': quality,
                'optimize': True,
                'progressive': True if quality > 60 else False
            }

            image.save(test_buffer, **save_kwargs)
            current_size = test_buffer.tell()

            # Calculate compression ratio
            compression_ratio = (1 - current_size / original_size_estimate) * 100

            # If we're close to target reduction or better, use this quality
            if compression_ratio >= self.TARGET_REDUCTION_PERCENT * 0.9:  # Within 90% of target
                final_quality = quality
                best_compression_ratio = compression_ratio
                break

            quality -= 5

        # Save with optimal settings
        save_kwargs = {
            'format': self.FORMAT,
            'quality': final_quality,
            'optimize': True,
            'progressive': True if final_quality > 60 else False
        }

        image.save(output_path, **save_kwargs)

        # Return metadata
        import os
        final_file_size = os.path.getsize(output_path)
        actual_reduction = (1 - final_file_size / original_size_estimate) * 100

        return {
            'file_path': output_path,
            'file_size_bytes': final_file_size,
            'file_size_mb': round(final_file_size / (1024 * 1024), 2),
            'original_size_estimate': original_size_estimate,
            'original_size_mb': round(original_size_estimate / (1024 * 1024), 2),
            'quality': final_quality,
            'dimensions': f'{image.size[0]}×{image.size[1]}',
            'format': self.FORMAT,
            'compression_ratio': f'{actual_reduction:.1f}%',
            'target_achieved': actual_reduction >= self.TARGET_REDUCTION_PERCENT * 0.8,
            'size_reduction': f'{original_size_estimate - final_file_size} bytes saved'
        }

    def get_compression_params(self, quality: int = 95) -> dict[str, Any]:
        """Get quick compress-specific compression parameters with dynamic progressive setting."""
        return {
            'format': self.FORMAT,
            'quality': quality,
            'optimize': True,
            'progressive': True if quality > 60 else False  # Dynamic progressive based on quality
        }

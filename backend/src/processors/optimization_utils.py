"""
Shared optimization utilities for image processors.

This module provides common functionality for file size optimization,
memory size calculation, and save operations that are used across
multiple processor implementations.
"""

import io
import logging
import os
from typing import Any, Dict, Optional

from PIL import Image

logger = logging.getLogger(__name__)


class OptimizationUtils:
    """Shared utilities for image processor optimization."""

    @staticmethod
    def get_image_memory_size(image: Image.Image) -> int:
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

    @staticmethod
    def optimize_file_size(
        image: Image.Image,
        max_size_bytes: int,
        format_type: str = 'JPEG',
        quality_start: int = 95,
        quality_min: int = 40,
        quality_step: int = 5,
        progressive: bool = True,
        extra_save_kwargs: Optional[Dict[str, Any]] = None
    ) -> Image.Image:
        """
        Optimize image file size by iteratively reducing quality.

        Args:
            image: PIL Image to optimize
            max_size_bytes: Maximum file size in bytes
            format_type: Output format ('JPEG', 'PNG', etc.)
            quality_start: Starting quality value
            quality_min: Minimum quality value
            quality_step: Quality reduction step
            progressive: Whether to use progressive JPEG
            extra_save_kwargs: Additional kwargs for Image.save()

        Returns:
            Optimized PIL Image
        """
        quality = quality_start
        extra_kwargs = extra_save_kwargs or {}

        logger.info(f"Optimizing file size: max={max_size_bytes} bytes, format={format_type}")
        logger.info(f"Quality range: {quality_start} to {quality_min}, step={quality_step}")

        attempt = 1
        while quality >= quality_min:
            output_buffer = io.BytesIO()

            # Prepare save kwargs
            save_kwargs = {
                'format': format_type,
                'quality': quality,
                'optimize': True,
                **extra_kwargs
            }

            # Add progressive for JPEG only
            if format_type.upper() == 'JPEG':
                save_kwargs['progressive'] = progressive

            image.save(output_buffer, **save_kwargs)
            file_size = output_buffer.tell()

            logger.info(f"Attempt {attempt}: Quality={quality}, size={file_size} bytes ({file_size/1024:.1f} KB)")

            # If file size is acceptable, return the image
            if file_size <= max_size_bytes:
                logger.info(f"✓ File size acceptable at Q={quality}")
                output_buffer.seek(0)
                return Image.open(output_buffer)

            # Reduce quality and try again
            logger.info(f"✗ File size {file_size} > {max_size_bytes}, reducing quality...")
            quality -= quality_step
            attempt += 1

        # If we can't meet size requirements, return with minimum quality
        logger.warning(f"Could not meet size requirements, using minimum quality {quality_min}")
        output_buffer = io.BytesIO()

        save_kwargs = {
            'format': format_type,
            'quality': quality_min,
            'optimize': True,
            **extra_kwargs
        }

        if format_type.upper() == 'JPEG':
            save_kwargs['progressive'] = progressive

        image.save(output_buffer, **save_kwargs)
        final_size = output_buffer.tell()
        logger.info(f"Final fallback: Q={quality_min}, size={final_size} bytes ({final_size/1024:.1f} KB)")
        output_buffer.seek(0)
        return Image.open(output_buffer)

    @staticmethod
    def save_optimized_with_metadata(
        image: Image.Image,
        output_path: str,
        max_size_bytes: int,
        format_type: str = 'JPEG',
        quality_start: int = 95,
        quality_min: int = 40,
        quality_step: int = 5,
        progressive: bool = True,
        extra_save_kwargs: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Save optimized image and return detailed metadata.

        Args:
            image: Processed PIL Image
            output_path: Path to save the image
            max_size_bytes: Maximum file size in bytes
            format_type: Output format
            quality_start: Starting quality value
            quality_min: Minimum quality value
            quality_step: Quality reduction step
            progressive: Whether to use progressive JPEG
            extra_save_kwargs: Additional kwargs for Image.save()

        Returns:
            Dictionary with save metadata
        """
        logger.info(f"Saving optimized image to: {output_path}")

        # Find optimal quality for file size
        quality = quality_start
        final_quality = quality_min
        extra_kwargs = extra_save_kwargs or {}

        while quality >= quality_min:
            test_buffer = io.BytesIO()

            save_kwargs = {
                'format': format_type,
                'quality': quality,
                'optimize': True,
                **extra_kwargs
            }

            if format_type.upper() == 'JPEG':
                save_kwargs['progressive'] = progressive

            image.save(test_buffer, **save_kwargs)
            test_size = test_buffer.tell()

            logger.info(f"Test save Q={quality}: {test_size} bytes ({test_size/1024:.1f} KB)")

            if test_size <= max_size_bytes:
                final_quality = quality
                logger.info(f"✓ Found optimal quality: Q={final_quality}")
                break
            quality -= quality_step

        # Save with optimal quality
        save_kwargs = {
            'format': format_type,
            'quality': final_quality,
            'optimize': True,
            **extra_kwargs
        }

        if format_type.upper() == 'JPEG':
            save_kwargs['progressive'] = progressive

        logger.info(f"Saving with final settings: Q={final_quality}, format={format_type}")
        image.save(output_path, **save_kwargs)

        # Return metadata
        file_size = os.path.getsize(output_path)
        logger.info(f"Final saved file size: {file_size} bytes ({file_size/1024:.1f} KB)")

        metadata = {
            'file_path': output_path,
            'file_size_bytes': file_size,
            'file_size_mb': round(file_size / (1024 * 1024), 2),
            'quality': final_quality,
            'dimensions': f'{image.size[0]}×{image.size[1]}',
            'format': format_type
        }

        logger.info(f"Metadata: {metadata}")
        return metadata

    @staticmethod
    def get_standard_compression_params(
        format_type: str = 'JPEG',
        quality: int = 95,
        progressive: bool = True
    ) -> Dict[str, Any]:
        """
        Get standardized compression parameters for different formats.

        Args:
            format_type: Output format
            quality: Quality level
            progressive: Whether to use progressive encoding

        Returns:
            Dictionary with compression parameters
        """
        params = {
            'format': format_type,
            'quality': quality,
            'optimize': True
        }

        if format_type.upper() == 'JPEG':
            params['progressive'] = progressive
        elif format_type.upper() == 'PNG':
            # PNG-specific optimizations
            params['compress_level'] = 6
        elif format_type.upper() == 'WEBP':
            # WebP-specific settings
            params['method'] = 6  # Higher compression method

        return params
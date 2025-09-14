import io
from typing import Any, Literal, Optional

from PIL import Image, ImageFile

from .base import BaseProcessor

# Allow loading of truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True

# Strategy-based quality settings
OPTIMIZATION_STRATEGIES = {
    'quality': {
        'quality_start': 95,
        'quality_min': 80,
        'progressive': True,
        'method': 6,  # WebP method for better quality
        'description': 'Prioritizes visual quality with higher compression settings'
    },
    'size': {
        'quality_start': 75,
        'quality_min': 45,
        'progressive': False,
        'method': 4,  # WebP method for better compression
        'description': 'Prioritizes smaller file sizes with aggressive compression'
    }
}


class CustomProcessor(BaseProcessor):
    """
    Enhanced processor for custom optimization with size vs quality strategies.

    Supports:
    - Size vs Quality optimization strategies
    - Original dimensions preservation
    - Custom dimensions with smart cropping
    - Multiple output formats with validation
    - Impossible combination detection
    """

    def __init__(
        self,
        width: Optional[int] = None,
        height: Optional[int] = None,
        max_size_mb: float = 5.0,
        format: str = 'JPEG',
        strategy: Literal['quality', 'size'] = 'quality',
        max_dimension: Optional[int] = None
    ):
        """
        Initialize custom processor with user-defined parameters.

        Args:
            width: Target width in pixels (None for original width)
            height: Target height in pixels (None for original height)
            max_size_mb: Maximum file size in MB
            format: Output format ('JPEG', 'PNG', 'WebP')
            strategy: 'quality' for best quality, 'size' for smallest files
            max_dimension: Maximum dimension constraint (width or height)
        """
        self.target_width = width
        self.target_height = height
        self.max_size_mb = max_size_mb
        self.format = format.upper()
        self.strategy = strategy
        self.max_dimension = max_dimension

        # Apply strategy-based settings
        strategy_config = OPTIMIZATION_STRATEGIES[strategy]
        self.quality_start = strategy_config['quality_start']
        self.quality_min = strategy_config['quality_min']
        self.progressive = strategy_config['progressive']
        self.webp_method = strategy_config['method']

        # Format-specific quality adjustments
        if self.format == 'PNG':
            # PNG is lossless, so quality settings don't apply
            self.quality_min = None
        elif self.format == 'WebP':
            # WebP can use different quality ranges
            if strategy == 'size':
                self.quality_min = max(30, self.quality_min - 10)

        # Validate impossible combinations early
        self._validate_requirements()

    def _validate_requirements(self):
        """
        Validate that the requirements are achievable.

        Raises:
            ValueError: If requirements are impossible to achieve
        """
        # Check for quality strategy with very small file size
        if (self.strategy == 'quality' and self.max_size_mb < 0.5 and
            self.format in ['JPEG', 'WebP']):
            raise ValueError(
                f"Impossible combination: 'Optimize for Quality' strategy cannot achieve "
                f"file size under {self.max_size_mb}MB. Try 'Optimize for Size' strategy "
                f"or increase the maximum file size to at least 1MB."
            )

        # Check for PNG with very small file size (PNG is lossless)
        if self.format == 'PNG' and self.max_size_mb < 1.0:
            if self.target_width and self.target_height:
                estimated_size = (self.target_width * self.target_height * 3) / (1024 * 1024)
                if estimated_size > self.max_size_mb:
                    raise ValueError(
                        f"Impossible combination: PNG format with {self.target_width}×{self.target_height} "
                        f"dimensions cannot achieve {self.max_size_mb}MB file size. "
                        f"Try JPEG format or increase dimensions/file size limit."
                    )

    def process(self, image: Image.Image) -> Image.Image:
        """
        Process image with custom optimization strategy.

        Args:
            image: Input PIL Image

        Returns:
            Processed PIL Image with custom specifications
        """
        # Handle different output formats
        if self.format == 'PNG':
            # PNG doesn't need RGB conversion, supports transparency
            pass
        elif self.format == 'WEBP':
            # WebP supports both RGB and RGBA
            pass
        else:
            # Default to JPEG, ensure RGB mode
            image = self._ensure_rgb(image)

        # Handle dimension processing
        processed_image = self._process_dimensions(image)

        # Optimize file size to meet constraints
        optimized_image = self._optimize_for_custom_size(processed_image)

        return optimized_image

    def _process_dimensions(self, image: Image.Image) -> Image.Image:
        """
        Process image dimensions based on target settings.

        Args:
            image: Input PIL Image

        Returns:
            Resized PIL Image
        """
        current_width, current_height = image.size

        # Handle max_dimension constraint
        if self.max_dimension:
            max_side = max(current_width, current_height)
            if max_side > self.max_dimension:
                # Scale down proportionally
                scale_factor = self.max_dimension / max_side
                new_width = int(current_width * scale_factor)
                new_height = int(current_height * scale_factor)
                image = self._resize_with_quality(image, new_width, new_height)
                current_width, current_height = new_width, new_height

        # Handle specific target dimensions
        if self.target_width and self.target_height:
            if image.size != (self.target_width, self.target_height):
                target_ratio = self.target_width / self.target_height
                current_ratio = current_width / current_height

                if abs(target_ratio - current_ratio) > 0.1:  # Different aspect ratios
                    # Smart crop to match aspect ratio, then resize to target dimensions
                    image = self._smart_crop(image, self.target_width, self.target_height)
                    image = self._resize_with_quality(image, self.target_width, self.target_height)
                else:
                    # Similar aspect ratios, just resize
                    image = self._resize_with_quality(image, self.target_width, self.target_height)
        elif self.target_width and not self.target_height:
            # Scale to target width, maintain aspect ratio
            aspect_ratio = current_height / current_width
            new_height = int(self.target_width * aspect_ratio)
            image = self._resize_with_quality(image, self.target_width, new_height)
        elif self.target_height and not self.target_width:
            # Scale to target height, maintain aspect ratio
            aspect_ratio = current_width / current_height
            new_width = int(self.target_height * aspect_ratio)
            image = self._resize_with_quality(image, new_width, self.target_height)

        return image

    def get_preset_config(self) -> dict[str, Any]:
        """Get custom processor configuration."""
        # Build dimension description
        if self.target_width and self.target_height:
            dimensions = f'{self.target_width}×{self.target_height}px'
            aspect_ratio = f'{self.target_width/self.target_height:.2f}:1'
        elif self.max_dimension:
            dimensions = f'Max {self.max_dimension}px (proportional)'
            aspect_ratio = 'Original'
        else:
            dimensions = 'Original dimensions'
            aspect_ratio = 'Original'

        strategy_info = OPTIMIZATION_STRATEGIES[self.strategy]

        return {
            'name': f'Custom ({self.strategy.title()})',
            'description': f'{strategy_info["description"]} - {dimensions}',
            'dimensions': dimensions,
            'max_file_size': f'<{self.max_size_mb}MB',
            'format': self.format,
            'aspect_ratio': aspect_ratio,
            'strategy': self.strategy,
            'use_case': f'Custom optimization prioritizing {self.strategy}',
            'customizable': True
        }

    def _optimize_for_custom_size(self, image: Image.Image) -> Image.Image:
        """
        Optimize image to meet custom file size requirements.
        
        Args:
            image: PIL Image to optimize
            
        Returns:
            Optimized PIL Image
        """
        max_size_bytes = int(self.max_size_mb * 1024 * 1024)
        quality = self.quality_start

        while quality >= (self.quality_min or 0):
            output_buffer = io.BytesIO()

            # Format-specific optimization
            save_kwargs = {
                'format': self.format,
                'optimize': True
            }

            if self.format == 'JPEG':
                save_kwargs.update({
                    'quality': quality,
                    'progressive': self.progressive
                })
            elif self.format == 'WebP':
                save_kwargs.update({
                    'quality': quality,
                    'method': self.webp_method,
                    'lossless': False
                })
            elif self.format == 'PNG':
                save_kwargs.update({
                    'compress_level': 9,  # Maximum PNG compression
                    'optimize': True
                })
                # PNG doesn't use quality parameter

            try:
                image.save(output_buffer, **save_kwargs)
                file_size = output_buffer.tell()

                # If file size is acceptable, return the image
                if file_size <= max_size_bytes:
                    output_buffer.seek(0)
                    return Image.open(output_buffer)

                # For PNG, we can't reduce quality, so break
                if self.format == 'PNG':
                    break

                quality -= 5

            except (OSError, NotImplementedError) as e:
                # Handle format not supported
                if self.format == 'WebP':
                    # Fallback to JPEG
                    self.format = 'JPEG'
                    continue
                else:
                    raise e

        # If we can't meet size requirements, return best effort
        output_buffer = io.BytesIO()
        save_kwargs = {
            'format': self.format,
            'optimize': True
        }

        if self.format == 'JPEG':
            save_kwargs.update({
                'quality': self.quality_min,
                'progressive': False
            })
        elif self.format == 'WebP':
            save_kwargs.update({
                'quality': self.quality_min,
                'method': 6,
                'lossless': False
            })
        elif self.format == 'PNG':
            save_kwargs.update({
                'compress_level': 9
            })

        image.save(output_buffer, **save_kwargs)
        output_buffer.seek(0)
        return Image.open(output_buffer)

    def save_optimized(self, image: Image.Image, output_path: str) -> dict[str, Any]:
        """
        Save custom optimized image and return metadata.
        
        Args:
            image: Processed PIL Image
            output_path: Path to save the image
            
        Returns:
            Dictionary with save metadata
        """
        max_size_bytes = int(self.max_size_mb * 1024 * 1024)
        quality = self.quality_start
        final_quality = quality

        # Find optimal settings for target file size
        while quality >= (self.quality_min or 0):
            test_buffer = io.BytesIO()
            save_kwargs = {
                'format': self.format,
                'optimize': True
            }

            if self.format == 'JPEG':
                save_kwargs.update({
                    'quality': quality,
                    'progressive': True if quality > 80 else False
                })
            elif self.format == 'WebP':
                save_kwargs.update({
                    'quality': quality,
                    'method': 6,
                    'lossless': False
                })
            elif self.format == 'PNG':
                save_kwargs['compress_level'] = 9
                quality = None  # PNG doesn't use quality

            try:
                image.save(test_buffer, **save_kwargs)
                file_size = test_buffer.tell()

                if file_size <= max_size_bytes:
                    final_quality = quality
                    break

                if self.format == 'PNG':
                    break  # Can't reduce PNG quality

                quality -= 5

            except (OSError, NotImplementedError):
                # Format fallback
                if self.format == 'WebP':
                    self.format = 'JPEG'
                    continue
                break

        # Save with optimal settings
        save_kwargs = {
            'format': self.format,
            'optimize': True
        }

        if self.format == 'JPEG':
            save_kwargs.update({
                'quality': final_quality or self.quality_min,
                'progressive': self.progressive
            })
        elif self.format == 'WebP':
            save_kwargs.update({
                'quality': final_quality or self.quality_min,
                'method': self.webp_method,
                'lossless': False
            })
        elif self.format == 'PNG':
            save_kwargs['compress_level'] = 9

        image.save(output_path, **save_kwargs)

        # Return metadata
        import os
        file_size = os.path.getsize(output_path)

        metadata = {
            'file_path': output_path,
            'file_size_bytes': file_size,
            'file_size_mb': round(file_size / (1024 * 1024), 2),
            'dimensions': f'{image.size[0]}×{image.size[1]}',
            'format': self.format,
            'meets_size_requirement': file_size <= max_size_bytes,
            'custom_width': self.target_width,
            'custom_height': self.target_height,
            'max_size_mb': self.max_size_mb
        }

        # Add quality info for lossy formats
        if self.format in ['JPEG', 'WebP'] and final_quality:
            metadata['quality'] = final_quality

        return metadata


    def get_compression_params(self, quality: int = 95) -> dict[str, Any]:
        """
        Get standardized compression parameters for this processor.
        Overrides base class to use strategy-specific settings.

        Args:
            quality: Base quality level (adjusted by strategy)

        Returns:
            Dictionary with PIL Image.save() parameters
        """
        # Adjust quality based on strategy
        if self.strategy == 'size':
            # For size optimization, use lower quality
            adjusted_quality = min(quality, self.quality_start)
        else:
            # For quality optimization, maintain high quality
            adjusted_quality = max(quality, self.quality_start)

        if self.format == 'JPEG':
            return {
                'format': self.format,
                'quality': adjusted_quality,
                'progressive': self.progressive,
                'optimize': True
            }
        elif self.format == 'WebP':
            return {
                'format': self.format,
                'quality': adjusted_quality,
                'method': self.webp_method,
                'lossless': False,
                'optimize': True
            }
        elif self.format == 'PNG':
            return {
                'format': self.format,
                'compress_level': 9,
                'optimize': True
            }
        else:
            # Fallback to JPEG
            return {
                'format': 'JPEG',
                'quality': adjusted_quality,
                'optimize': True
            }


# Factory function for creating custom processors
def create_custom_processor(
    width: Optional[int] = None,
    height: Optional[int] = None,
    max_size_mb: float = 5.0,
    format: str = 'JPEG',
    strategy: Literal['quality', 'size'] = 'quality',
    max_dimension: Optional[int] = None
) -> CustomProcessor:
    """
    Enhanced factory function to create a custom processor with specified parameters.

    Args:
        width: Target width in pixels (None for original width)
        height: Target height in pixels (None for original height)
        max_size_mb: Maximum file size in MB
        format: Output format ('JPEG', 'PNG', 'WebP')
        strategy: 'quality' for best quality, 'size' for smallest files
        max_dimension: Maximum dimension constraint (width or height)

    Returns:
        Configured CustomProcessor instance

    Raises:
        ValueError: If requirements are impossible to achieve
    """
    return CustomProcessor(
        width=width,
        height=height,
        max_size_mb=max_size_mb,
        format=format,
        strategy=strategy,
        max_dimension=max_dimension
    )


# Legacy factory function for backwards compatibility
def create_custom_processor_legacy(width: int, height: int, max_size_mb: float = 5.0,
                                 format: str = 'JPEG') -> CustomProcessor:
    """
    Legacy factory function for backwards compatibility.

    Args:
        width: Target width in pixels
        height: Target height in pixels
        max_size_mb: Maximum file size in MB
        format: Output format ('JPEG', 'PNG', 'WebP')

    Returns:
        Configured CustomProcessor instance with 'quality' strategy
    """
    return CustomProcessor(width, height, max_size_mb, format, strategy='quality')

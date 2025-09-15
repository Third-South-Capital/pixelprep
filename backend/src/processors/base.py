from abc import ABC, abstractmethod
from typing import Any

from PIL import Image
from .optimization_utils import OptimizationUtils


class BaseProcessor(ABC):
    """Abstract base class for all image processors."""

    @abstractmethod
    def process(self, image: Image.Image) -> Image.Image:
        """
        Process the input image according to the processor's preset.
        
        Args:
            image: PIL Image object to process
            
        Returns:
            Processed PIL Image object
        """
        pass

    @abstractmethod
    def get_preset_config(self) -> dict[str, Any]:
        """
        Get the configuration parameters for this preset.
        
        Returns:
            Dictionary containing preset configuration
        """
        pass

    def _ensure_rgb(self, image: Image.Image) -> Image.Image:
        """Convert image to RGB mode if necessary."""
        if image.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'RGBA':
                background.paste(image, mask=image.split()[-1])
            else:
                background.paste(image, mask=image.split()[-1])
            return background
        elif image.mode != 'RGB':
            return image.convert('RGB')
        return image

    def _smart_crop(self, image: Image.Image, target_width: int, target_height: int) -> Image.Image:
        """
        Smart crop image to target dimensions while preserving important content.
        Centers the crop on the image.
        """
        current_width, current_height = image.size
        target_ratio = target_width / target_height
        current_ratio = current_width / current_height

        if current_ratio > target_ratio:
            # Image is wider than target, crop horizontally
            new_width = int(current_height * target_ratio)
            left = (current_width - new_width) // 2
            right = left + new_width
            return image.crop((left, 0, right, current_height))
        else:
            # Image is taller than target, crop vertically
            new_height = int(current_width / target_ratio)
            top = (current_height - new_height) // 2
            bottom = top + new_height
            return image.crop((0, top, current_width, bottom))

    def _resize_with_quality(self, image: Image.Image, target_width: int, target_height: int) -> Image.Image:
        """Resize image with high quality resampling."""
        return image.resize((target_width, target_height), Image.Resampling.LANCZOS)

    def get_compression_params(self, quality: int = 95, format_type: str = 'JPEG') -> dict[str, Any]:
        """
        Get standardized compression parameters for this processor.
        Each processor can override this to provide format-specific settings.

        Args:
            quality: Quality level (1-100)
            format_type: Output format

        Returns:
            Dictionary with PIL Image.save() parameters
        """
        return OptimizationUtils.get_standard_compression_params(
            format_type=format_type,
            quality=quality
        )

    def get_image_memory_size(self, image: Image.Image) -> int:
        """Get approximate memory size of a PIL Image."""
        return OptimizationUtils.get_image_memory_size(image)

    def optimize_file_size(
        self,
        image: Image.Image,
        max_size_bytes: int,
        format_type: str = 'JPEG',
        quality_start: int = 95,
        quality_min: int = 40,
        **kwargs
    ) -> Image.Image:
        """Optimize image file size using shared utilities."""
        return OptimizationUtils.optimize_file_size(
            image=image,
            max_size_bytes=max_size_bytes,
            format_type=format_type,
            quality_start=quality_start,
            quality_min=quality_min,
            **kwargs
        )

    def save_optimized_with_metadata(
        self,
        image: Image.Image,
        output_path: str,
        max_size_bytes: int,
        format_type: str = 'JPEG',
        **kwargs
    ) -> dict[str, Any]:
        """Save optimized image with metadata using shared utilities."""
        return OptimizationUtils.save_optimized_with_metadata(
            image=image,
            output_path=output_path,
            max_size_bytes=max_size_bytes,
            format_type=format_type,
            **kwargs
        )

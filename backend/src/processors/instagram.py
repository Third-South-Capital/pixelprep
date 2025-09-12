import io
from typing import Dict, Any
from PIL import Image, ImageFile
from .base import BaseProcessor

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
        # Ensure RGB mode for JPEG output
        image = self._ensure_rgb(image)
        
        # Smart crop to square aspect ratio if needed
        current_width, current_height = image.size
        if current_width != current_height:
            image = self._smart_crop(image, self.TARGET_WIDTH, self.TARGET_HEIGHT)
        
        # Resize to target dimensions
        if image.size != (self.TARGET_WIDTH, self.TARGET_HEIGHT):
            image = self._resize_with_quality(image, self.TARGET_WIDTH, self.TARGET_HEIGHT)
        
        # Optimize file size while maintaining quality
        optimized_image = self._optimize_file_size(image)
        
        return optimized_image
    
    def get_preset_config(self) -> Dict[str, Any]:
        """Get Instagram square preset configuration."""
        return {
            'name': 'Instagram Square',
            'description': 'Optimized for Instagram square posts',
            'dimensions': f'{self.TARGET_WIDTH}×{self.TARGET_HEIGHT}px',
            'max_file_size': f'<{self.MAX_FILE_SIZE_MB}MB',
            'format': self.FORMAT,
            'color_space': 'sRGB',
            'aspect_ratio': '1:1'
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
            
            # If file size is acceptable, return the image
            if file_size <= max_size_bytes:
                output_buffer.seek(0)
                return Image.open(output_buffer)
            
            # Reduce quality and try again
            quality -= 5
        
        # If we can't meet size requirements, return with minimum quality
        output_buffer = io.BytesIO()
        image.save(output_buffer, format=self.FORMAT, quality=self.QUALITY_MIN, optimize=True)
        output_buffer.seek(0)
        return Image.open(output_buffer)
    
    def save_optimized(self, image: Image.Image, output_path: str) -> Dict[str, Any]:
        """
        Save optimized image and return metadata.
        
        Args:
            image: Processed PIL Image
            output_path: Path to save the image
            
        Returns:
            Dictionary with save metadata
        """
        # Get optimal quality for file size
        max_size_bytes = self.MAX_FILE_SIZE_MB * 1024 * 1024
        quality = self.QUALITY_START
        final_quality = quality
        
        while quality >= self.QUALITY_MIN:
            test_buffer = io.BytesIO()
            image.save(test_buffer, format=self.FORMAT, quality=quality, optimize=True)
            if test_buffer.tell() <= max_size_bytes:
                final_quality = quality
                break
            quality -= 5
        
        # Save with optimal quality
        save_kwargs = {
            'format': self.FORMAT,
            'quality': final_quality,
            'optimize': True,
            'progressive': True
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
            'format': self.FORMAT
        }
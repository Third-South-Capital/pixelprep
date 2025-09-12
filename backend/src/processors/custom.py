import io
from typing import Dict, Any, Optional
from PIL import Image, ImageFile
from .base import BaseProcessor

# Allow loading of truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True


class CustomProcessor(BaseProcessor):
    """Processor for custom dimensions: Accept width, height, max_size_mb as parameters."""
    
    def __init__(self, width: int, height: int, max_size_mb: float = 5.0, format: str = 'JPEG'):
        """
        Initialize custom processor with user-defined parameters.
        
        Args:
            width: Target width in pixels
            height: Target height in pixels  
            max_size_mb: Maximum file size in MB
            format: Output format ('JPEG', 'PNG', 'WebP')
        """
        self.target_width = width
        self.target_height = height
        self.max_size_mb = max_size_mb
        self.format = format.upper()
        self.quality_start = 95
        self.quality_min = 50 if format.upper() == 'JPEG' else 80
    
    def process(self, image: Image.Image) -> Image.Image:
        """
        Process image with custom dimensions and size constraints.
        
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
        
        # Resize to target dimensions with smart cropping if needed
        if image.size != (self.target_width, self.target_height):
            # First try smart crop to match aspect ratio
            target_ratio = self.target_width / self.target_height
            current_ratio = image.size[0] / image.size[1]
            
            if abs(target_ratio - current_ratio) > 0.1:  # Different aspect ratios
                image = self._smart_crop(image, self.target_width, self.target_height)
            else:
                # Similar aspect ratios, just resize
                image = self._resize_with_quality(image, self.target_width, self.target_height)
        
        # Optimize file size to meet constraints
        optimized_image = self._optimize_for_custom_size(image)
        
        return optimized_image
    
    def get_preset_config(self) -> Dict[str, Any]:
        """Get custom processor configuration."""
        return {
            'name': 'Custom',
            'description': f'Custom dimensions: {self.target_width}×{self.target_height}px',
            'dimensions': f'{self.target_width}×{self.target_height}px',
            'max_file_size': f'<{self.max_size_mb}MB',
            'format': self.format,
            'aspect_ratio': f'{self.target_width/self.target_height:.2f}:1',
            'use_case': 'User-defined specifications',
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
        
        while quality >= self.quality_min:
            output_buffer = io.BytesIO()
            
            # Format-specific optimization
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
                    'method': 6,  # Better compression
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
    
    def save_optimized(self, image: Image.Image, output_path: str) -> Dict[str, Any]:
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
        while quality >= self.quality_min:
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
                'progressive': True if (final_quality or self.quality_min) > 80 else False
            })
        elif self.format == 'WebP':
            save_kwargs.update({
                'quality': final_quality or self.quality_min,
                'method': 6,
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


# Factory function for creating custom processors
def create_custom_processor(width: int, height: int, max_size_mb: float = 5.0, 
                           format: str = 'JPEG') -> CustomProcessor:
    """
    Factory function to create a custom processor with specified parameters.
    
    Args:
        width: Target width in pixels
        height: Target height in pixels
        max_size_mb: Maximum file size in MB
        format: Output format ('JPEG', 'PNG', 'WebP')
        
    Returns:
        Configured CustomProcessor instance
    """
    return CustomProcessor(width, height, max_size_mb, format)
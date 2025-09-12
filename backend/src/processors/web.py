import io
from typing import Dict, Any
from PIL import Image, ImageFile
from .base import BaseProcessor

# Allow loading of truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True


class WebDisplayProcessor(BaseProcessor):
    """Processor for web display format: 1920px wide, <500KB, WebP with JPEG fallback."""
    
    TARGET_WIDTH = 1920
    MAX_FILE_SIZE_KB = 500
    PRIMARY_FORMAT = 'WebP'
    FALLBACK_FORMAT = 'JPEG'
    QUALITY_START = 90
    QUALITY_MIN = 50
    
    def process(self, image: Image.Image) -> Image.Image:
        """
        Process image for web display format.
        
        Args:
            image: Input PIL Image
            
        Returns:
            Processed PIL Image optimized for web display
        """
        # Ensure RGB mode
        image = self._ensure_rgb(image)
        
        # Resize to target width while preserving aspect ratio
        resized_image = self._resize_to_width(image, self.TARGET_WIDTH)
        
        # Try WebP first, fallback to JPEG if needed
        try:
            optimized_image = self._optimize_for_web(resized_image, self.PRIMARY_FORMAT)
            return optimized_image
        except (OSError, NotImplementedError):
            # WebP not supported, use JPEG fallback
            optimized_image = self._optimize_for_web(resized_image, self.FALLBACK_FORMAT)
            return optimized_image
    
    def get_preset_config(self) -> Dict[str, Any]:
        """Get web display preset configuration."""
        return {
            'name': 'Web Display',
            'description': 'Optimized for website galleries and online portfolios',
            'dimensions': f'{self.TARGET_WIDTH}px wide (height auto)',
            'max_file_size': f'<{self.MAX_FILE_SIZE_KB}KB',
            'primary_format': self.PRIMARY_FORMAT,
            'fallback_format': self.FALLBACK_FORMAT,
            'aspect_ratio': 'Preserved',
            'use_case': 'Website galleries, online portfolios, fast web loading'
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
    
    def _optimize_for_web(self, image: Image.Image, format_type: str) -> Image.Image:
        """
        Optimize image for web display with target file size.
        
        Args:
            image: PIL Image to optimize
            format_type: 'WebP' or 'JPEG'
            
        Returns:
            Optimized PIL Image
        """
        max_size_bytes = self.MAX_FILE_SIZE_KB * 1024
        quality = self.QUALITY_START
        
        while quality >= self.QUALITY_MIN:
            output_buffer = io.BytesIO()
            
            # Save with current quality
            save_kwargs = {
                'format': format_type,
                'quality': quality,
                'optimize': True
            }
            
            # WebP-specific optimization
            if format_type == 'WebP':
                save_kwargs['method'] = 6  # Better compression
                save_kwargs['lossless'] = False
            
            # JPEG-specific optimization
            if format_type == 'JPEG':
                save_kwargs['progressive'] = True
            
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
        save_kwargs = {
            'format': format_type,
            'quality': self.QUALITY_MIN,
            'optimize': True
        }
        
        if format_type == 'WebP':
            save_kwargs['method'] = 6
            save_kwargs['lossless'] = False
        elif format_type == 'JPEG':
            save_kwargs['progressive'] = True
            
        image.save(output_buffer, **save_kwargs)
        output_buffer.seek(0)
        return Image.open(output_buffer)
    
    def save_optimized(self, image: Image.Image, output_path: str) -> Dict[str, Any]:
        """
        Save optimized image for web display and return metadata.
        
        Args:
            image: Processed PIL Image
            output_path: Path to save the image
            
        Returns:
            Dictionary with save metadata
        """
        # Determine format from output path
        format_type = self.PRIMARY_FORMAT
        if output_path.lower().endswith('.jpg') or output_path.lower().endswith('.jpeg'):
            format_type = self.FALLBACK_FORMAT
        
        # Find optimal quality for target file size
        max_size_bytes = self.MAX_FILE_SIZE_KB * 1024
        quality = self.QUALITY_START
        final_quality = quality
        
        while quality >= self.QUALITY_MIN:
            test_buffer = io.BytesIO()
            save_kwargs = {
                'format': format_type,
                'quality': quality,
                'optimize': True
            }
            
            if format_type == 'WebP':
                save_kwargs['method'] = 6
                save_kwargs['lossless'] = False
            elif format_type == 'JPEG':
                save_kwargs['progressive'] = True
            
            try:
                image.save(test_buffer, **save_kwargs)
                file_size = test_buffer.tell()
                
                if file_size <= max_size_bytes:
                    final_quality = quality
                    break
                quality -= 5
            except (OSError, NotImplementedError):
                # Fallback to JPEG if WebP fails
                if format_type == 'WebP':
                    format_type = self.FALLBACK_FORMAT
                    save_kwargs = {
                        'format': format_type,
                        'quality': quality,
                        'optimize': True,
                        'progressive': True
                    }
                    image.save(test_buffer, **save_kwargs)
                    file_size = test_buffer.tell()
                    
                    if file_size <= max_size_bytes:
                        final_quality = quality
                        break
                    quality -= 5
                else:
                    raise
        
        # Save with optimal settings
        save_kwargs = {
            'format': format_type,
            'quality': final_quality,
            'optimize': True
        }
        
        if format_type == 'WebP':
            save_kwargs['method'] = 6
            save_kwargs['lossless'] = False
        elif format_type == 'JPEG':
            save_kwargs['progressive'] = True
        
        try:
            image.save(output_path, **save_kwargs)
        except (OSError, NotImplementedError):
            # Final fallback to JPEG
            format_type = self.FALLBACK_FORMAT
            output_path = output_path.rsplit('.', 1)[0] + '.jpg'
            save_kwargs = {
                'format': format_type,
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
            'file_size_kb': round(file_size / 1024, 1),
            'quality': final_quality,
            'dimensions': f'{image.size[0]}×{image.size[1]}',
            'format': format_type,
            'meets_size_requirement': file_size <= (self.MAX_FILE_SIZE_KB * 1024),
            'compression_ratio': f'{image.size[0] / self.TARGET_WIDTH:.1f}x' if image.size[0] != self.TARGET_WIDTH else '1.0x'
        }
"""
Temporary storage implementation for anonymous users.

This module provides in-memory storage capabilities for users who 
don't want to authenticate, maintaining the original Phase 1 functionality.
"""

import tempfile
from typing import Dict, Any
from pathlib import Path


class TemporaryStorage:
    """Temporary storage for anonymous users - in-memory processing only."""
    
    def __init__(self):
        """Initialize temporary storage manager."""
        pass
    
    def create_temp_file(self, suffix: str = None) -> str:
        """
        Create a temporary file and return its path.
        
        Args:
            suffix: File extension (e.g., '.jpg')
            
        Returns:
            Path to temporary file
        """
        temp_file = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
        temp_file.close()
        return temp_file.name
    
    def cleanup_temp_file(self, file_path: str) -> bool:
        """
        Clean up a temporary file.
        
        Args:
            file_path: Path to file to delete
            
        Returns:
            True if cleanup successful, False otherwise
        """
        try:
            Path(file_path).unlink(missing_ok=True)
            return True
        except Exception:
            return False
    
    def get_temp_dir(self) -> str:
        """
        Get system temporary directory path.
        
        Returns:
            Path to temp directory
        """
        return tempfile.gettempdir()
    
    def process_image_temporary(self, image_data: bytes, processor, filename: str) -> Dict[str, Any]:
        """
        Process image data temporarily without persistence.
        
        This method is kept for compatibility but not used in current implementation
        since the optimize endpoint handles temporary processing directly.
        
        Args:
            image_data: Raw image bytes
            processor: Image processor instance
            filename: Original filename
            
        Returns:
            Dictionary with processing results
        """
        return {
            "storage_type": "temporary",
            "message": "Temporary processing handled by optimize endpoint",
            "persistent": False
        }
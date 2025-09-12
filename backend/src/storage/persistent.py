"""
Persistent storage implementation using Supabase Storage.

This module provides persistent image storage capabilities for authenticated users,
complementing the temporary storage for anonymous users.
"""

import os
import uuid
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from .supabase_client import get_supabase_client, get_storage_helper
from .temporary import TemporaryStorage


class PersistentStorage:
    """Persistent storage for authenticated users using Supabase Storage."""
    
    def __init__(self, user_id: str):
        """
        Initialize persistent storage for a specific user.
        
        Args:
            user_id: User ID for organizing files
        """
        self.user_id = user_id
        self.supabase = get_supabase_client()
        self.storage_helper = get_storage_helper()
        self.temp_storage = TemporaryStorage()
    
    def store_original_image(self, image_path: str, filename: str, 
                           metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Store original image in persistent storage.
        
        Args:
            image_path: Local path to the image file
            filename: Original filename
            metadata: Image metadata
            
        Returns:
            Dictionary with storage information
        """
        try:
            # Generate unique storage filename
            file_extension = Path(filename).suffix
            storage_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Upload to Supabase Storage
            upload_result = self.storage_helper.upload_original_image(
                image_path, self.user_id, storage_filename
            )
            
            if not upload_result["success"]:
                return {
                    "success": False,
                    "error": f"Storage upload failed: {upload_result['error']}"
                }
            
            # Save record to database
            image_record = {
                "user_id": self.user_id,
                "original_filename": filename,
                "storage_path": upload_result["storage_path"],
                "public_url": upload_result["public_url"],
                "file_size_bytes": os.path.getsize(image_path),
                "dimensions": metadata.get("dimensions", "Unknown"),
                "format": metadata.get("format", "Unknown"),
                "uploaded_at": datetime.utcnow().isoformat(),
                "metadata": metadata
            }
            
            db_result = self.supabase.table("images").insert(image_record).execute()
            
            if not db_result.data:
                return {
                    "success": False,
                    "error": "Failed to save image record to database"
                }
            
            image_id = db_result.data[0]["id"]
            
            return {
                "success": True,
                "image_id": image_id,
                "storage_path": upload_result["storage_path"],
                "public_url": upload_result["public_url"],
                "persistent": True
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def store_optimized_image(self, image_path: str, image_id: str, preset: str,
                            optimization_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Store optimized image in persistent storage.
        
        Args:
            image_path: Local path to the optimized image file
            image_id: ID of the original image record
            preset: Optimization preset used
            optimization_metadata: Optimization results metadata
            
        Returns:
            Dictionary with storage information
        """
        try:
            # Get original image info
            original_image = self.supabase.table("images").select("*").eq("id", image_id).single().execute()
            
            if not original_image.data:
                return {
                    "success": False,
                    "error": "Original image not found"
                }
            
            original_filename = original_image.data["original_filename"]
            base_filename = Path(original_filename).stem
            file_extension = Path(image_path).suffix
            storage_filename = f"{base_filename}_{preset}{file_extension}"
            
            # Upload to Supabase Storage
            upload_result = self.storage_helper.upload_optimized_image(
                image_path, self.user_id, storage_filename, preset
            )
            
            if not upload_result["success"]:
                return {
                    "success": False,
                    "error": f"Storage upload failed: {upload_result['error']}"
                }
            
            # Save optimization record to database
            optimization_record = {
                "image_id": image_id,
                "user_id": self.user_id,
                "preset": preset,
                "storage_path": upload_result["storage_path"],
                "public_url": upload_result["public_url"],
                "file_size_bytes": os.path.getsize(image_path),
                "optimized_at": datetime.utcnow().isoformat(),
                "metadata": optimization_metadata
            }
            
            db_result = self.supabase.table("optimizations").insert(optimization_record).execute()
            
            if not db_result.data:
                return {
                    "success": False,
                    "error": "Failed to save optimization record to database"
                }
            
            optimization_id = db_result.data[0]["id"]
            
            return {
                "success": True,
                "optimization_id": optimization_id,
                "storage_path": upload_result["storage_path"],
                "public_url": upload_result["public_url"],
                "persistent": True
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_user_images(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """
        Get user's uploaded images with pagination.
        
        Args:
            limit: Maximum number of images to return
            offset: Number of images to skip
            
        Returns:
            Dictionary with images and pagination info
        """
        try:
            # Get images with their optimizations
            images_query = (
                self.supabase
                .table("images")
                .select("*, optimizations(*)")
                .eq("user_id", self.user_id)
                .order("uploaded_at", desc=True)
                .limit(limit)
                .offset(offset)
            )
            
            result = images_query.execute()
            
            # Get total count for pagination
            count_result = (
                self.supabase
                .table("images")
                .select("id", count="exact")
                .eq("user_id", self.user_id)
                .execute()
            )
            
            total_count = count_result.count if count_result.count else 0
            
            return {
                "success": True,
                "images": result.data,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": (offset + limit) < total_count
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_optimization_history(self, image_id: str) -> Dict[str, Any]:
        """
        Get optimization history for a specific image.
        
        Args:
            image_id: ID of the original image
            
        Returns:
            Dictionary with optimization history
        """
        try:
            result = (
                self.supabase
                .table("optimizations")
                .select("*")
                .eq("image_id", image_id)
                .eq("user_id", self.user_id)  # Ensure user owns the image
                .order("optimized_at", desc=True)
                .execute()
            )
            
            return {
                "success": True,
                "optimizations": result.data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def delete_image(self, image_id: str) -> Dict[str, Any]:
        """
        Delete image and all its optimizations.
        
        Args:
            image_id: ID of the image to delete
            
        Returns:
            Dictionary with deletion status
        """
        try:
            # Get image record to verify ownership and get storage paths
            image_result = (
                self.supabase
                .table("images")
                .select("*, optimizations(*)")
                .eq("id", image_id)
                .eq("user_id", self.user_id)
                .single()
                .execute()
            )
            
            if not image_result.data:
                return {
                    "success": False,
                    "error": "Image not found or not owned by user"
                }
            
            image_data = image_result.data
            
            # Delete optimized images from storage
            for optimization in image_data.get("optimizations", []):
                try:
                    self.supabase.storage.from_("optimized").remove([optimization["storage_path"]])
                except:
                    pass  # Continue even if storage deletion fails
            
            # Delete original image from storage
            try:
                self.supabase.storage.from_("originals").remove([image_data["storage_path"]])
            except:
                pass  # Continue even if storage deletion fails
            
            # Delete optimization records
            self.supabase.table("optimizations").delete().eq("image_id", image_id).execute()
            
            # Delete image record
            self.supabase.table("images").delete().eq("id", image_id).execute()
            
            return {
                "success": True,
                "message": "Image and optimizations deleted successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_storage_usage(self) -> Dict[str, Any]:
        """
        Get user's storage usage statistics.
        
        Returns:
            Dictionary with usage statistics
        """
        try:
            # Get image count and total size
            images_result = (
                self.supabase
                .table("images")
                .select("file_size_bytes")
                .eq("user_id", self.user_id)
                .execute()
            )
            
            # Get optimization count and total size
            optimizations_result = (
                self.supabase
                .table("optimizations")
                .select("file_size_bytes")
                .eq("user_id", self.user_id)
                .execute()
            )
            
            original_images_count = len(images_result.data)
            original_total_size = sum(img.get("file_size_bytes", 0) for img in images_result.data)
            
            optimizations_count = len(optimizations_result.data)
            optimizations_total_size = sum(opt.get("file_size_bytes", 0) for opt in optimizations_result.data)
            
            total_size = original_total_size + optimizations_total_size
            
            return {
                "success": True,
                "usage": {
                    "original_images_count": original_images_count,
                    "original_total_size_bytes": original_total_size,
                    "original_total_size_mb": round(original_total_size / (1024 * 1024), 2),
                    "optimizations_count": optimizations_count,
                    "optimizations_total_size_bytes": optimizations_total_size,
                    "optimizations_total_size_mb": round(optimizations_total_size / (1024 * 1024), 2),
                    "total_size_bytes": total_size,
                    "total_size_mb": round(total_size / (1024 * 1024), 2)
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
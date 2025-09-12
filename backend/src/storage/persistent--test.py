"""
Tests for persistent storage functionality.
"""

import os
import tempfile
from unittest.mock import patch, MagicMock, mock_open
import pytest

from .persistent import PersistentStorage


class TestPersistentStorage:
    """Test persistent storage operations."""
    
    @patch('backend.src.storage.persistent.get_supabase_client')
    @patch('backend.src.storage.persistent.get_storage_helper')
    def test_initialization(self, mock_get_storage, mock_get_supabase):
        """Test persistent storage initialization."""
        mock_client = MagicMock()
        mock_storage_helper = MagicMock()
        
        mock_get_supabase.return_value = mock_client
        mock_get_storage.return_value = mock_storage_helper
        
        storage = PersistentStorage("user123")
        
        assert storage.user_id == "user123"
        assert storage.supabase == mock_client
        assert storage.storage_helper == mock_storage_helper
    
    @patch('backend.src.storage.persistent.get_supabase_client')
    @patch('backend.src.storage.persistent.get_storage_helper')
    @patch('os.path.getsize')
    @patch('uuid.uuid4')
    def test_store_original_image_success(self, mock_uuid, mock_getsize, 
                                        mock_get_storage, mock_get_supabase):
        """Test successful original image storage."""
        # Setup mocks
        mock_uuid.return_value = MagicMock()
        mock_uuid.return_value.__str__ = lambda x: "test-uuid"
        mock_getsize.return_value = 1024000  # 1MB
        
        mock_storage_helper = MagicMock()
        mock_storage_helper.upload_original_image.return_value = {
            "success": True,
            "storage_path": "user123/test-uuid.jpg",
            "public_url": "https://test.com/image.jpg"
        }
        
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_execute = MagicMock()
        mock_execute.data = [{"id": "img123"}]
        
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value = mock_execute
        
        mock_get_supabase.return_value = mock_client
        mock_get_storage.return_value = mock_storage_helper
        
        # Test storage
        storage = PersistentStorage("user123")
        result = storage.store_original_image(
            "/fake/path.jpg", 
            "test.jpg", 
            {"dimensions": "800x600", "format": "JPEG"}
        )
        
        assert result["success"] is True
        assert result["image_id"] == "img123"
        assert result["persistent"] is True
        assert "storage_path" in result
        assert "public_url" in result
        
        # Verify upload was called
        mock_storage_helper.upload_original_image.assert_called_once_with(
            "/fake/path.jpg", "user123", "test-uuid.jpg"
        )
        
        # Verify database insert was called
        mock_table.insert.assert_called_once()
    
    @patch('backend.src.storage.persistent.get_supabase_client')
    @patch('backend.src.storage.persistent.get_storage_helper')
    def test_store_original_image_upload_failure(self, mock_get_storage, mock_get_supabase):
        """Test original image storage with upload failure."""
        mock_storage_helper = MagicMock()
        mock_storage_helper.upload_original_image.return_value = {
            "success": False,
            "error": "Upload failed"
        }
        
        mock_get_storage.return_value = mock_storage_helper
        
        storage = PersistentStorage("user123")
        result = storage.store_original_image("/fake/path.jpg", "test.jpg", {})
        
        assert result["success"] is False
        assert "Upload failed" in result["error"]
    
    @patch('backend.src.storage.persistent.get_supabase_client')
    @patch('backend.src.storage.persistent.get_storage_helper')
    @patch('os.path.getsize')
    def test_store_optimized_image_success(self, mock_getsize, mock_get_storage, mock_get_supabase):
        """Test successful optimized image storage."""
        mock_getsize.return_value = 512000  # 512KB
        
        # Mock original image lookup
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_eq = MagicMock()
        mock_single = MagicMock()
        mock_execute = MagicMock()
        mock_execute.data = {"original_filename": "test.jpg"}
        
        mock_client.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq
        mock_eq.single.return_value = mock_single
        mock_single.execute.return_value = mock_execute
        
        # Mock optimized image upload
        mock_storage_helper = MagicMock()
        mock_storage_helper.upload_optimized_image.return_value = {
            "success": True,
            "storage_path": "user123/test_instagram.jpg",
            "public_url": "https://test.com/optimized.jpg"
        }
        
        # Mock optimization record insert
        mock_insert = MagicMock()
        mock_insert_execute = MagicMock()
        mock_insert_execute.data = [{"id": "opt123"}]
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value = mock_insert_execute
        
        mock_get_supabase.return_value = mock_client
        mock_get_storage.return_value = mock_storage_helper
        
        storage = PersistentStorage("user123")
        result = storage.store_optimized_image(
            "/fake/optimized.jpg",
            "img123",
            "instagram_square",
            {"quality": 85, "file_size_mb": 0.5}
        )
        
        assert result["success"] is True
        assert result["optimization_id"] == "opt123"
        assert result["persistent"] is True
    
    @patch('backend.src.storage.persistent.get_supabase_client')
    def test_get_user_images(self, mock_get_supabase):
        """Test getting user's images with pagination."""
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_eq = MagicMock()
        mock_order = MagicMock()
        mock_limit = MagicMock()
        mock_offset = MagicMock()
        mock_execute = MagicMock()
        mock_execute.data = [{"id": "img1"}, {"id": "img2"}]
        
        # Chain the mocks
        mock_client.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq
        mock_eq.order.return_value = mock_order
        mock_order.limit.return_value = mock_limit
        mock_limit.offset.return_value = mock_offset
        mock_offset.execute.return_value = mock_execute
        
        # Mock count query
        mock_count_result = MagicMock()
        mock_count_result.count = 10
        mock_select.eq.return_value.execute.return_value = mock_count_result
        
        mock_get_supabase.return_value = mock_client
        
        storage = PersistentStorage("user123")
        result = storage.get_user_images(limit=5, offset=0)
        
        assert result["success"] is True
        assert len(result["images"]) == 2
        assert result["total_count"] == 10
        assert result["has_more"] is True
    
    @patch('backend.src.storage.persistent.get_supabase_client')
    def test_delete_image_success(self, mock_get_supabase):
        """Test successful image deletion."""
        mock_client = MagicMock()
        
        # Mock image lookup
        mock_image_data = {
            "id": "img123",
            "storage_path": "user123/image.jpg",
            "processed_images": [
                {"storage_path": "user123/image_opt1.jpg"},
                {"storage_path": "user123/image_opt2.jpg"}
            ]
        }
        
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_eq1 = MagicMock()
        mock_eq2 = MagicMock()
        mock_single = MagicMock()
        mock_execute = MagicMock()
        mock_execute.data = mock_image_data
        
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq1
        mock_eq1.eq.return_value = mock_eq2
        mock_eq2.single.return_value = mock_single
        mock_single.execute.return_value = mock_execute
        
        # Mock storage operations
        mock_storage_optimized = MagicMock()
        mock_storage_originals = MagicMock()
        mock_client.storage.from_.side_effect = lambda bucket: {
            "optimized": mock_storage_optimized,
            "originals": mock_storage_originals
        }[bucket]
        
        # Mock delete operations
        mock_delete = MagicMock()
        mock_table.delete.return_value = mock_delete
        mock_delete.eq.return_value = mock_execute
        
        mock_client.table.return_value = mock_table
        mock_get_supabase.return_value = mock_client
        
        storage = PersistentStorage("user123")
        result = storage.delete_image("img123")
        
        assert result["success"] is True
        assert "deleted successfully" in result["message"]
        
        # Verify storage deletions were attempted
        mock_storage_optimized.remove.assert_called()
        mock_storage_originals.remove.assert_called()
    
    @patch('backend.src.storage.persistent.get_supabase_client')
    def test_get_storage_usage(self, mock_get_supabase):
        """Test getting user's storage usage statistics."""
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        
        # Mock images query
        mock_images_result = MagicMock()
        mock_images_result.data = [
            {"original_size": 1024000},  # 1MB
            {"original_size": 2048000}   # 2MB
        ]
        
        # Mock processed images query  
        mock_processed_images_result = MagicMock()
        mock_processed_images_result.data = [
            {"file_size_bytes": 512000},   # 512KB
            {"file_size_bytes": 256000}    # 256KB
        ]
        
        mock_select = MagicMock()
        mock_eq = MagicMock()
        mock_select.eq.return_value = mock_eq
        mock_eq.execute.side_effect = [mock_images_result, mock_processed_images_result]
        mock_table.select.return_value = mock_select
        
        mock_get_supabase.return_value = mock_client
        
        storage = PersistentStorage("user123")
        result = storage.get_storage_usage()
        
        assert result["success"] is True
        usage = result["usage"]
        
        assert usage["original_images_count"] == 2
        assert usage["original_total_size_mb"] == 2.93  # ~3MB total
        assert usage["processed_images_count"] == 2
        assert usage["processed_images_total_size_mb"] == 0.75  # 768KB = 0.75MB
        assert usage["total_size_mb"] == 3.68  # ~3.68MB total
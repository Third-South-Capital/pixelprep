"""
Tests for Supabase client functionality.
"""

import os
from unittest.mock import MagicMock, patch

import pytest

from .supabase_client import SupabaseClient, SupabaseStorage


class TestSupabaseClient:
    """Test Supabase client initialization and configuration."""

    @patch.dict(os.environ, {
        'SUPABASE_URL': 'https://test.supabase.co',
        'SUPABASE_SERVICE_KEY': 'test_service_key'
    })
    @patch('backend.src.storage.supabase_client.create_client')
    def test_client_initialization_success(self, mock_create_client):
        """Test successful client initialization."""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client

        # Reset singleton instance
        SupabaseClient._instance = None
        SupabaseClient._client = None

        client = SupabaseClient()

        mock_create_client.assert_called_once_with(
            'https://test.supabase.co',
            'test_service_key'
        )
        assert client.client == mock_client

    def test_client_initialization_missing_url(self):
        """Test client initialization fails with missing URL."""
        with patch.dict(os.environ, {}, clear=True):
            # Reset singleton instance
            SupabaseClient._instance = None
            SupabaseClient._client = None

            with pytest.raises(ValueError, match="SUPABASE_URL and SUPABASE_SERVICE_KEY must be set"):
                SupabaseClient()

    def test_client_initialization_placeholder_values(self):
        """Test client initialization fails with placeholder values."""
        with patch.dict(os.environ, {
            'SUPABASE_URL': 'https://your-project-id.supabase.co',
            'SUPABASE_SERVICE_KEY': 'test_key'
        }):
            # Reset singleton instance
            SupabaseClient._instance = None
            SupabaseClient._client = None

            with pytest.raises(ValueError, match="Please configure your actual Supabase URL"):
                SupabaseClient()

    @patch.dict(os.environ, {
        'SUPABASE_URL': 'https://test.supabase.co',
        'SUPABASE_SERVICE_KEY': 'test_service_key'
    })
    @patch('backend.src.storage.supabase_client.create_client')
    def test_singleton_pattern(self, mock_create_client):
        """Test that client follows singleton pattern."""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client

        # Reset singleton instance
        SupabaseClient._instance = None
        SupabaseClient._client = None

        client1 = SupabaseClient()
        client2 = SupabaseClient()

        assert client1 is client2
        assert mock_create_client.call_count == 1

    @patch.dict(os.environ, {
        'SUPABASE_URL': 'https://test.supabase.co',
        'SUPABASE_SERVICE_KEY': 'test_service_key'
    })
    @patch('backend.src.storage.supabase_client.create_client')
    def test_connection_test_success(self, mock_create_client):
        """Test successful connection test."""
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_limit = MagicMock()

        # Setup mock chain
        mock_client.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.limit.return_value = mock_limit
        mock_limit.execute.return_value = MagicMock(data=[])

        mock_create_client.return_value = mock_client

        # Reset singleton instance
        SupabaseClient._instance = None
        SupabaseClient._client = None

        client = SupabaseClient()
        result = client.test_connection()

        assert result["status"] == "connected"
        assert "Successfully connected" in result["message"]


class TestSupabaseStorage:
    """Test Supabase storage operations."""

    @patch.dict(os.environ, {
        'SUPABASE_STORAGE_BUCKET_ORIGINALS': 'test-originals',
        'SUPABASE_STORAGE_BUCKET_OPTIMIZED': 'test-optimized'
    })
    def test_storage_initialization(self):
        """Test storage helper initialization."""
        mock_client = MagicMock()

        storage = SupabaseStorage(mock_client)

        assert storage.client == mock_client
        assert storage.originals_bucket == 'test-originals'
        assert storage.optimized_bucket == 'test-optimized'

    def test_storage_default_buckets(self):
        """Test storage helper with default bucket names."""
        mock_client = MagicMock()

        # Clear environment
        with patch.dict(os.environ, {}, clear=True):
            storage = SupabaseStorage(mock_client)

            assert storage.originals_bucket == 'originals'
            assert storage.optimized_bucket == 'optimized'

    @patch('builtins.open', create=True)
    def test_upload_original_image_success(self, mock_open):
        """Test successful original image upload."""
        mock_client = MagicMock()
        mock_storage = MagicMock()
        mock_bucket = MagicMock()

        # Setup mock chain
        mock_client.storage.from_.return_value = mock_bucket
        mock_bucket.upload.return_value = MagicMock(status_code=200)
        mock_bucket.get_public_url.return_value = "https://test.com/image.jpg"

        # Mock file content
        mock_file = MagicMock()
        mock_file.read.return_value = b"fake image data"
        mock_open.return_value.__enter__.return_value = mock_file

        storage = SupabaseStorage(mock_client)
        result = storage.upload_original_image("/fake/path.jpg", "user123", "test.jpg")

        assert result["success"] is True
        assert result["storage_path"] == "user123/test.jpg"
        assert "public_url" in result

        mock_client.storage.from_.assert_called_with('originals')
        mock_bucket.upload.assert_called_once()

    @patch('builtins.open', create=True)
    def test_upload_optimized_image_success(self, mock_open):
        """Test successful optimized image upload."""
        mock_client = MagicMock()
        mock_storage = MagicMock()
        mock_bucket = MagicMock()

        # Setup mock chain
        mock_client.storage.from_.return_value = mock_bucket
        mock_bucket.upload.return_value = MagicMock(status_code=200)
        mock_bucket.get_public_url.return_value = "https://test.com/image.jpg"

        # Mock file content
        mock_file = MagicMock()
        mock_file.read.return_value = b"fake image data"
        mock_open.return_value.__enter__.return_value = mock_file

        storage = SupabaseStorage(mock_client)
        result = storage.upload_optimized_image("/fake/path.jpg", "user123", "test.jpg", "instagram_square")

        assert result["success"] is True
        assert result["storage_path"] == "user123/test_instagram_square.jpg"
        assert result["preset"] == "instagram_square"
        assert "public_url" in result

        mock_client.storage.from_.assert_called_with('optimized')
        mock_bucket.upload.assert_called_once()

    def test_create_buckets_success(self):
        """Test successful bucket creation."""
        mock_client = MagicMock()
        mock_storage = MagicMock()

        mock_client.storage.create_bucket.return_value = None

        storage = SupabaseStorage(mock_client)
        result = storage.create_buckets_if_not_exist()

        assert result["success"] is True
        assert "buckets" in result

        # Should try to create both buckets
        assert mock_client.storage.create_bucket.call_count == 2

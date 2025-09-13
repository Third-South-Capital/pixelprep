"""
Supabase client configuration and utilities for PixelPrep.

This module provides authenticated Supabase client instances and helper functions
for database operations and storage management.
"""

import os
from typing import Any, Optional

from dotenv import load_dotenv
from supabase import Client, create_client

# Load environment variables
load_dotenv()


class SupabaseClient:
    """Singleton Supabase client manager."""

    _instance: Optional['SupabaseClient'] = None
    _client: Client | None = None

    def __new__(cls) -> 'SupabaseClient':
        """Ensure singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize Supabase client if not already done."""
        if self._client is None:
            self._initialize_client()

    def _initialize_client(self):
        """Initialize the Supabase client with environment variables."""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")

        if not supabase_url or not supabase_service_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables"
            )

        if supabase_url == "https://your-project-id.supabase.co":
            raise ValueError(
                "Please configure your actual Supabase URL in .env file"
            )

        if supabase_service_key == "your_service_key_here":
            raise ValueError(
                "Please configure your actual Supabase service key in .env file"
            )

        try:
            self._client = create_client(supabase_url, supabase_service_key)
            print(f"✅ Supabase client initialized for {supabase_url}")
        except Exception as e:
            raise ConnectionError(f"Failed to initialize Supabase client: {e}")

    @property
    def client(self) -> Client:
        """Get the Supabase client instance."""
        if self._client is None:
            self._initialize_client()
        return self._client

    def test_connection(self) -> dict[str, Any]:
        """Test the Supabase connection."""
        try:
            # Try a simple operation to test connectivity
            response = self.client.table("_test_").select("*").limit(1).execute()
            return {
                "status": "connected",
                "message": "Successfully connected to Supabase",
                "data": response.data
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Connection test failed: {str(e)}",
                "data": None
            }


class SupabaseStorage:
    """Helper class for Supabase Storage operations."""

    def __init__(self, client: Client | None = None):
        """Initialize storage helper with Supabase client."""
        self.client = client or get_supabase_client()
        self.originals_bucket = os.getenv("SUPABASE_STORAGE_BUCKET_ORIGINALS", "originals")
        self.optimized_bucket = os.getenv("SUPABASE_STORAGE_BUCKET_OPTIMIZED", "optimized")

    def upload_original_image(self, file_path: str, user_id: str, filename: str) -> dict[str, Any]:
        """
        Upload original image to Supabase Storage.
        
        Args:
            file_path: Local path to the image file
            user_id: User ID for organizing files
            filename: Desired filename in storage
            
        Returns:
            Dictionary with upload result and metadata
        """
        try:
            storage_path = f"{user_id}/{filename}"

            with open(file_path, 'rb') as f:
                response = self.client.storage.from_(self.originals_bucket).upload(
                    storage_path, f.read()
                )

            if response.status_code == 200:
                # Get public URL
                public_url = self.client.storage.from_(self.originals_bucket).get_public_url(storage_path)

                return {
                    "success": True,
                    "storage_path": storage_path,
                    "public_url": public_url,
                    "bucket": self.originals_bucket
                }
            else:
                return {
                    "success": False,
                    "error": f"Upload failed with status: {response.status_code}"
                }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def upload_optimized_image(self, file_path: str, user_id: str, filename: str,
                             preset: str) -> dict[str, Any]:
        """
        Upload optimized image to Supabase Storage.
        
        Args:
            file_path: Local path to the optimized image file
            user_id: User ID for organizing files
            filename: Base filename
            preset: Optimization preset used
            
        Returns:
            Dictionary with upload result and metadata
        """
        try:
            # Include preset in the filename
            base_name = filename.rsplit('.', 1)[0] if '.' in filename else filename
            extension = filename.rsplit('.', 1)[1] if '.' in filename else 'jpg'
            storage_filename = f"{base_name}_{preset}.{extension}"
            storage_path = f"{user_id}/{storage_filename}"

            with open(file_path, 'rb') as f:
                response = self.client.storage.from_(self.optimized_bucket).upload(
                    storage_path, f.read()
                )

            if response.status_code == 200:
                # Get public URL
                public_url = self.client.storage.from_(self.optimized_bucket).get_public_url(storage_path)

                return {
                    "success": True,
                    "storage_path": storage_path,
                    "public_url": public_url,
                    "bucket": self.optimized_bucket,
                    "preset": preset
                }
            else:
                return {
                    "success": False,
                    "error": f"Upload failed with status: {response.status_code}"
                }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def create_buckets_if_not_exist(self) -> dict[str, Any]:
        """
        Create storage buckets if they don't exist.
        
        Returns:
            Dictionary with creation status
        """
        try:
            results = {}

            # Try to create buckets (will fail if they already exist, which is fine)
            try:
                self.client.storage.create_bucket(self.originals_bucket, {"public": False})
                results["originals"] = "created"
            except:
                results["originals"] = "already exists"

            try:
                self.client.storage.create_bucket(self.optimized_bucket, {"public": True})
                results["optimized"] = "created"
            except:
                results["optimized"] = "already exists"

            return {
                "success": True,
                "buckets": results
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instance getter
def get_supabase_client() -> Client:
    """Get the global Supabase client instance."""
    return SupabaseClient().client


def get_storage_helper() -> SupabaseStorage:
    """Get a storage helper instance."""
    return SupabaseStorage()


def setup_database_schema() -> dict[str, Any]:
    """
    Set up the database schema for PixelPrep.
    
    This should be run once during deployment to create necessary tables.
    
    Returns:
        Dictionary with setup status
    """
    try:
        client = get_supabase_client()

        # Note: In production, you'd run these as migrations via Supabase dashboard
        # This is a placeholder for the tables we'll need:

        tables_needed = [
            "users",           # User profiles and auth info
            "images",          # Original images uploaded
            "optimizations",   # Optimization history and results
            "usage_analytics"  # Track usage for business insights
        ]

        return {
            "success": True,
            "message": "Schema setup ready - create tables via Supabase dashboard",
            "tables_needed": tables_needed
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

"""
Tests for temporary storage functionality.
"""

import tempfile
from pathlib import Path

from .temporary import TemporaryStorage


class TestTemporaryStorage:
    """Test temporary storage operations."""

    def setup_method(self):
        """Set up test fixtures."""
        self.storage = TemporaryStorage()

    def test_initialization(self):
        """Test temporary storage initialization."""
        storage = TemporaryStorage()
        assert storage is not None

    def test_create_temp_file(self):
        """Test temporary file creation."""
        temp_path = self.storage.create_temp_file(suffix='.jpg')

        assert temp_path is not None
        assert temp_path.endswith('.jpg')
        assert Path(temp_path).exists()

        # Cleanup
        self.storage.cleanup_temp_file(temp_path)

    def test_create_temp_file_no_suffix(self):
        """Test temporary file creation without suffix."""
        temp_path = self.storage.create_temp_file()

        assert temp_path is not None
        assert Path(temp_path).exists()

        # Cleanup
        self.storage.cleanup_temp_file(temp_path)

    def test_cleanup_temp_file_success(self):
        """Test successful temporary file cleanup."""
        temp_path = self.storage.create_temp_file(suffix='.png')

        # Verify file exists
        assert Path(temp_path).exists()

        # Cleanup and verify
        result = self.storage.cleanup_temp_file(temp_path)
        assert result is True
        assert not Path(temp_path).exists()

    def test_cleanup_temp_file_nonexistent(self):
        """Test cleanup of non-existent file."""
        fake_path = "/fake/nonexistent/file.jpg"
        result = self.storage.cleanup_temp_file(fake_path)

        # Should not raise error, should return True (missing_ok=True)
        assert result is True

    def test_get_temp_dir(self):
        """Test getting temporary directory."""
        temp_dir = self.storage.get_temp_dir()

        assert temp_dir is not None
        assert Path(temp_dir).exists()
        assert Path(temp_dir).is_dir()

        # Should match system temp dir
        assert temp_dir == tempfile.gettempdir()

    def test_process_image_temporary(self):
        """Test temporary image processing compatibility method."""
        result = self.storage.process_image_temporary(
            b"fake image data",
            None,
            "test.jpg"
        )

        assert result["storage_type"] == "temporary"
        assert result["persistent"] is False
        assert "message" in result

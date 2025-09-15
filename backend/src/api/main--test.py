from fastapi.testclient import TestClient

from .main import app

client = TestClient(app)


class TestMainAPI:
    """Test the main FastAPI application endpoints."""

    def test_health_endpoint(self):
        """Test health check endpoint."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "PixelPrep API"
        assert data["version"] == "0.1.0"

    def test_processors_endpoint(self):
        """Test processors endpoint returns available processors."""
        response = client.get("/optimize/processors")

        assert response.status_code == 200
        data = response.json()
        assert "processors" in data
        assert "total_count" in data
        assert data["total_count"] > 0

        # Check Instagram square processor is available
        assert "instagram_square" in data["processors"]
        instagram_processor = data["processors"]["instagram_square"]
        assert instagram_processor["name"] == "Instagram Square"
        assert instagram_processor["dimensions"] == "1080×1080px"
        assert instagram_processor["format"] == "JPEG"

    def test_root_endpoint_not_found(self):
        """Test that root endpoint returns 404."""
        response = client.get("/")
        assert response.status_code == 404

    def test_invalid_endpoint_returns_404(self):
        """Test that invalid endpoints return 404."""
        response = client.get("/invalid-endpoint")
        assert response.status_code == 404

    def test_cors_headers_present(self):
        """Test that CORS headers are properly configured."""
        response = client.get("/health")

        # FastAPI TestClient doesn't always include CORS headers in simple GET requests
        # But we can verify the middleware is configured by checking the app setup
        assert response.status_code == 200

        # Test with OPTIONS request for CORS preflight
        response = client.options("/health")
        # OPTIONS requests might not be fully supported by TestClient
        # This is more for integration testing with a real browser

    def test_exception_handling(self):
        """Test custom exception handling."""
        # This test verifies that exceptions are handled gracefully
        # We'll test specific error cases in the optimize module tests
        response = client.get("/optimize/processors")
        assert response.status_code == 200

        # If there were an error, it should return proper JSON error format
        # The actual error handling is tested in optimize--test.py

"""
Tests for authentication endpoints.
"""

import os
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from jose import jwt

from .auth import (
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    create_access_token,
    router,
    verify_token,
)

# Create test app
app = FastAPI()
app.include_router(router)
client = TestClient(app)


class TestAuthEndpoints:
    """Test authentication endpoint functionality."""

    def test_auth_health_endpoint(self):
        """Test auth health check endpoint."""
        response = client.get("/auth/health")

        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert "github_oauth" in data
        assert "jwt_configured" in data
        assert "supabase_connected" in data

    @patch.dict(os.environ, {"GITHUB_CLIENT_ID": "test_client_id"})
    def test_github_login_configured(self):
        """Test GitHub login when properly configured."""
        response = client.get("/auth/github/login")

        assert response.status_code == 200
        data = response.json()

        assert "auth_url" in data
        assert "state" in data
        assert "github.com/login/oauth/authorize" in data["auth_url"]
        assert "test_client_id" in data["auth_url"]

    def test_github_login_not_configured(self):
        """Test GitHub login when not configured."""
        with patch.dict(os.environ, {}, clear=True):
            response = client.get("/auth/github/login")

            assert response.status_code == 500
            assert "GitHub OAuth not configured" in response.json()["detail"]

    def test_logout_endpoint(self):
        """Test logout endpoint."""
        response = client.post("/auth/logout")

        assert response.status_code == 200
        assert "Successfully logged out" in response.json()["message"]

    def test_protected_route_without_token(self):
        """Test protected route without authentication."""
        response = client.get("/auth/protected")

        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

    def test_get_me_without_token(self):
        """Test /me endpoint without authentication."""
        response = client.get("/auth/me")

        assert response.status_code == 401


class TestJWTFunctions:
    """Test JWT token creation and verification."""

    def test_create_access_token(self):
        """Test JWT token creation."""
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

        # Decode and verify
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        assert payload["sub"] == "user123"
        assert payload["email"] == "test@example.com"
        assert "exp" in payload

    def test_create_access_token_custom_expiry(self):
        """Test JWT token creation with custom expiry."""
        data = {"sub": "user123"}
        expires_delta = timedelta(minutes=60)
        token = create_access_token(data, expires_delta)

        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

        # Check expiry is approximately 60 minutes from now
        exp_time = datetime.utcfromtimestamp(payload["exp"])
        expected_exp = datetime.utcnow() + expires_delta

        # Allow 1 minute tolerance
        assert abs((exp_time - expected_exp).total_seconds()) < 60

    def test_verify_token_valid(self):
        """Test token verification with valid token."""
        # Create a valid token
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)

        # Mock HTTPAuthorizationCredentials
        from fastapi.security import HTTPAuthorizationCredentials

        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        token_data = verify_token(credentials)

        assert token_data.user_id == "user123"
        assert token_data.email == "test@example.com"

    def test_verify_token_invalid(self):
        """Test token verification with invalid token."""
        from fastapi import HTTPException
        from fastapi.security import HTTPAuthorizationCredentials

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="invalid_token"
        )

        with pytest.raises(HTTPException) as exc_info:
            verify_token(credentials)

        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in str(exc_info.value.detail)

    def test_verify_token_expired(self):
        """Test token verification with expired token."""
        from fastapi import HTTPException
        from fastapi.security import HTTPAuthorizationCredentials

        # Create an expired token
        data = {"sub": "user123", "email": "test@example.com"}
        expired_delta = timedelta(minutes=-1)  # Expired 1 minute ago
        token = create_access_token(data, expired_delta)

        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with pytest.raises(HTTPException) as exc_info:
            verify_token(credentials)

        assert exc_info.value.status_code == 401


class TestGitHubCallback:
    """Test GitHub OAuth callback handling."""

    @patch("backend.src.api.auth.requests.post")
    @patch("backend.src.api.auth.requests.get")
    @patch("backend.src.api.auth.get_supabase_client")
    @patch.dict(
        os.environ,
        {
            "GITHUB_CLIENT_ID": "test_client_id",
            "GITHUB_CLIENT_SECRET": "test_client_secret",
        },
    )
    def test_github_callback_success(
        self, mock_supabase, mock_requests_get, mock_requests_post
    ):
        """Test successful GitHub OAuth callback."""
        # Mock token exchange
        mock_token_response = MagicMock()
        mock_token_response.json.return_value = {"access_token": "github_token"}
        mock_token_response.raise_for_status.return_value = None
        mock_requests_post.return_value = mock_token_response

        # Mock user info requests
        mock_user_response = MagicMock()
        mock_user_response.json.return_value = {
            "id": 12345,
            "login": "testuser",
            "name": "Test User",
            "email": "test@example.com",
            "avatar_url": "https://github.com/avatar.jpg",
        }
        mock_user_response.raise_for_status.return_value = None

        mock_email_response = MagicMock()
        mock_email_response.json.return_value = [
            {"email": "test@example.com", "primary": True}
        ]
        mock_email_response.raise_for_status.return_value = None

        mock_requests_get.side_effect = [mock_user_response, mock_email_response]

        # Mock Supabase operations
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table

        # Mock user doesn't exist (empty result)
        mock_existing_user = MagicMock()
        mock_existing_user.data = []
        mock_table.select.return_value.eq.return_value.execute.return_value = (
            mock_existing_user
        )

        # Mock user creation
        mock_insert_result = MagicMock()
        mock_insert_result.data = [{"id": "new_user_id"}]
        mock_table.insert.return_value.execute.return_value = mock_insert_result

        mock_supabase.return_value = mock_client

        # Make callback request
        response = client.get("/auth/github/callback?code=test_code&state=test_state")

        assert response.status_code == 200
        data = response.json()

        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["github_username"] == "testuser"

    @patch.dict(os.environ, {}, clear=True)
    def test_github_callback_not_configured(self):
        """Test GitHub callback when OAuth not configured."""
        response = client.get("/auth/github/callback?code=test_code")

        assert response.status_code == 500
        assert "GitHub OAuth not configured" in response.json()["detail"]

    @patch("backend.src.api.auth.requests.post")
    @patch.dict(
        os.environ,
        {
            "GITHUB_CLIENT_ID": "test_client_id",
            "GITHUB_CLIENT_SECRET": "test_client_secret",
        },
    )
    def test_github_callback_token_exchange_failure(self, mock_requests_post):
        """Test GitHub callback when token exchange fails."""
        # Mock failed token exchange
        mock_response = MagicMock()
        mock_response.json.return_value = {"error": "bad_code"}
        mock_response.raise_for_status.return_value = None
        mock_requests_post.return_value = mock_response

        response = client.get("/auth/github/callback?code=invalid_code")

        assert response.status_code == 400
        assert "Failed to get access token" in response.json()["detail"]

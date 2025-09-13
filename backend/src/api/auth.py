"""
Authentication endpoints for PixelPrep using Supabase Auth and GitHub OAuth.
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Any

import requests
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from ..storage.supabase_client import get_supabase_client

# Router for auth endpoints
router = APIRouter(prefix="/auth", tags=["authentication"])

# Security scheme
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

# JWT Configuration (for custom tokens - legacy)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

# Environment Validation - Ensure Required Secrets Are Set
def validate_auth_environment():
    """Validate that required authentication environment variables are set."""
    required_vars = {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_JWT_SECRET": os.getenv("SUPABASE_JWT_SECRET"),
        "GITHUB_CLIENT_ID": os.getenv("GITHUB_CLIENT_ID"),
        "GITHUB_CLIENT_SECRET": os.getenv("GITHUB_CLIENT_SECRET")
    }

    missing_vars = [var for var, value in required_vars.items() if not value]

    if missing_vars:
        raise ValueError(
            f"Missing required environment variables: {', '.join(missing_vars)}. "
            f"Authentication will be disabled."
        )

    return True

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# GitHub OAuth Configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")  # For OAuth callback

# Authentication Toggle - Controls whether auth is required for the app
AUTH_REQUIRED = os.getenv("AUTH_REQUIRED", "false").lower() == "true"

# Validate environment on module import (fail fast)
AUTH_ENABLED = False
try:
    validate_auth_environment()
    AUTH_ENABLED = True
except ValueError as e:
    print(f"⚠️  AUTH WARNING: {e}")
    AUTH_ENABLED = False

# Auth Status Summary
if AUTH_REQUIRED and not AUTH_ENABLED:
    print(f"🚨 AUTH ERROR: AUTH_REQUIRED=true but authentication is not properly configured!")
elif AUTH_REQUIRED and AUTH_ENABLED:
    print(f"🔐 AUTH MODE: Authentication required and properly configured")
elif not AUTH_REQUIRED and AUTH_ENABLED:
    print(f"🔓 MIXED MODE: Authentication available but not required (optional)")
else:
    print(f"🚪 ANONYMOUS MODE: Authentication disabled, anonymous access only")


# Pydantic Models
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class TokenData(BaseModel):
    user_id: str | None = None
    email: str | None = None


class User(BaseModel):
    id: str
    email: str
    display_name: str | None = None
    avatar_url: str | None = None
    subscription_tier: str | None = None  # subscription tier
    created_at: datetime
    updated_at: datetime


# JWT Token Functions
def create_access_token(
    data: dict[str, Any], expires_delta: timedelta | None = None
) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """Verify Supabase JWT token and return user data."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode Supabase JWT token
        payload = jwt.decode(
            credentials.credentials,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )

        user_id: str = payload.get("sub")
        email: str = payload.get("email")

        if user_id is None:
            raise credentials_exception

        print(f"🔍 [SUPABASE JWT] Verified token for user: {email} (ID: {user_id})")

        token_data = TokenData(user_id=user_id, email=email)
        return token_data

    except JWTError as e:
        print(f"🔍 [SUPABASE JWT] Token verification failed: {str(e)}")
        raise credentials_exception

# Legacy custom token verification (kept for compatibility)
def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """Verify JWT token and return user data."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email")

        if user_id is None:
            raise credentials_exception

        token_data = TokenData(user_id=user_id, email=email)
        return token_data

    except JWTError:
        raise credentials_exception


async def get_current_user(token_data: TokenData = Depends(verify_supabase_token)) -> User:
    """Get current user from token data."""
    try:
        supabase = get_supabase_client()

        # Get user from database
        response = (
            supabase.table("profiles")
            .select("*")
            .eq("id", token_data.user_id)
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return User(**response.data)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate user: {str(e)}",
        )


def verify_optional_supabase_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security),
) -> TokenData | None:
    """Verify Supabase JWT token optionally (returns None if no token provided)."""
    if credentials is None:
        return None

    # If auth is disabled (no Supabase secrets), skip verification
    if not AUTH_ENABLED:
        print("🔍 [SUPABASE JWT OPTIONAL] Auth disabled, skipping token verification")
        return None

    # If no JWT secret configured, can't verify tokens
    if not SUPABASE_JWT_SECRET:
        print("🔍 [SUPABASE JWT OPTIONAL] No JWT secret configured, skipping verification")
        return None

    try:
        # Decode Supabase JWT token
        payload = jwt.decode(
            credentials.credentials,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email")

        if user_id is None:
            return None

        print(f"🔍 [SUPABASE JWT OPTIONAL] Verified token for user: {email}")

        return TokenData(user_id=user_id, email=email)

    except JWTError as e:
        print(f"🔍 [SUPABASE JWT OPTIONAL] Token verification failed: {str(e)}")
        return None

# Legacy optional token verification
def verify_optional_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security),
) -> TokenData | None:
    """Verify JWT token optionally (returns None if no token provided)."""
    if credentials is None:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email")

        if user_id is None:
            return None

        return TokenData(user_id=user_id, email=email)

    except JWTError:
        return None


async def get_current_user_optional(
    token_data: TokenData | None = Depends(verify_optional_supabase_token),
) -> User | None:
    """Get current user from token data, or None if not authenticated."""
    if token_data is None:
        return None

    try:
        supabase = get_supabase_client()

        # Get user from database
        response = (
            supabase.table("profiles")
            .select("*")
            .eq("id", token_data.user_id)
            .single()
            .execute()
        )

        if not response.data:
            return None

        return User(**response.data)

    except Exception:
        return None


# Auth Endpoints
@router.get("/github/login")
async def github_login(request: Request):
    """Initiate GitHub OAuth flow."""

    # If auth is not required, return a message indicating anonymous mode
    if not AUTH_REQUIRED:
        return {
            "message": "Authentication not required - running in anonymous mode",
            "auth_required": False,
            "anonymous_access": True,
            "auth_url": None
        }

    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth not configured",
        )

    # Generate state parameter for security
    state = secrets.token_urlsafe(32)

    # Store state in session (in production, use Redis or database)
    # For now, we'll include it in the redirect and validate on callback

    # Use configured backend URL instead of dynamic request.base_url
    redirect_uri = f"{BACKEND_URL}/auth/github/callback"

    # Debug logging
    print(f"🔍 [OAUTH DEBUG] BACKEND_URL: {BACKEND_URL}")
    print(f"🔍 [OAUTH DEBUG] redirect_uri: {redirect_uri}")
    print(f"🔍 [OAUTH DEBUG] GITHUB_CLIENT_ID: {GITHUB_CLIENT_ID}")

    github_oauth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={GITHUB_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=user:email&"
        f"state={state}"
    )

    print(f"🔍 [OAUTH DEBUG] Generated OAuth URL: {github_oauth_url}")

    return {"auth_url": github_oauth_url, "state": state}


@router.get("/github/callback")
async def github_callback(request: Request, code: str, state: str = None):
    """Handle GitHub OAuth callback."""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth not configured",
        )

    try:
        # Exchange code for access token
        token_response = requests.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
            timeout=10,
        )

        token_response.raise_for_status()
        token_data = token_response.json()

        if "access_token" not in token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get access token from GitHub",
            )

        github_token = token_data["access_token"]

        # Get user info from GitHub
        user_response = requests.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github.v3+json",
            },
            timeout=10,
        )

        user_response.raise_for_status()
        github_user = user_response.json()

        # Get user's primary email
        email_response = requests.get(
            "https://api.github.com/user/emails",
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github.v3+json",
            },
            timeout=10,
        )

        email_response.raise_for_status()
        emails = email_response.json()
        primary_email = next(
            (email["email"] for email in emails if email["primary"]),
            github_user.get("email"),
        )

        # Create or sign in user with Supabase Auth
        supabase = get_supabase_client()

        try:
            # Try to sign in with email (user might already exist)
            auth_response = supabase.auth.sign_in_with_password(
                {
                    "email": primary_email,
                    "password": f"github_oauth_{github_user['id']}",  # Temporary password pattern
                }
            )
            user_id = auth_response.user.id
            print(f"User signed in: {user_id}")

        except Exception as signin_error:
            print(f"Sign in failed, creating new user: {signin_error}")

            # User doesn't exist, create via Auth
            try:
                auth_response = supabase.auth.sign_up(
                    {
                        "email": primary_email,
                        "password": f"github_oauth_{github_user['id']}",  # Temporary password
                        "options": {
                            "data": {
                                "display_name": github_user.get("name")
                                or github_user.get("login"),
                                "avatar_url": github_user.get("avatar_url"),
                                "provider": "github",
                            }
                        },
                    }
                )
                user_id = auth_response.user.id
                print(f"New user created: {user_id}")

                # Create corresponding profile record (since no auto-trigger exists)
                try:
                    profile_data = {
                        "id": str(user_id),  # Use the auth user ID
                        "email": primary_email,
                        "display_name": github_user.get("name")
                        or github_user.get("login"),
                        "avatar_url": github_user.get("avatar_url"),
                    }

                    profile_result = (
                        supabase.table("profiles").insert(profile_data).execute()
                    )
                    print(
                        f"Profile created: {profile_result.data[0]['id'] if profile_result.data else 'unknown'}"
                    )

                except Exception as profile_error:
                    print(f"Profile creation failed: {profile_error}")
                    # Don't fail the entire auth flow - user is created in auth system

            except Exception as signup_error:
                print(f"Signup failed: {signup_error}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to create user account: {str(signup_error)}",
                )

        # Also ensure profile exists for sign-in case
        try:
            existing_profile = (
                supabase.table("profiles").select("*").eq("id", str(user_id)).execute()
            )
            if not existing_profile.data:
                print(f"Creating missing profile for existing user: {user_id}")
                profile_data = {
                    "id": str(user_id),
                    "email": primary_email,
                    "display_name": github_user.get("name") or github_user.get("login"),
                    "avatar_url": github_user.get("avatar_url"),
                }
                supabase.table("profiles").insert(profile_data).execute()
                print("Profile created for existing user")
        except Exception as e:
            print(f"Profile check/creation failed: {e}")

        # Create JWT token
        access_token = create_access_token(
            data={"sub": str(user_id), "email": primary_email}
        )

        # In production, you'd redirect to frontend with token as a secure cookie
        # For now, return JSON response
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user_id,
                "email": primary_email,
                "name": github_user.get("name"),
                "avatar_url": github_user.get("avatar_url"),
                "github_username": github_user.get("login"),
            },
        }

    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GitHub OAuth failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}",
        )


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.post("/logout")
async def logout():
    """Logout user (client should delete token)."""
    return {"message": "Successfully logged out"}


@router.get("/health")
async def auth_health():
    """Health check for auth service."""
    github_configured = bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)

    return {
        "status": "healthy",
        "auth_required": AUTH_REQUIRED,
        "auth_enabled": AUTH_ENABLED,
        "github_oauth": github_configured,
        "jwt_configured": bool(JWT_SECRET_KEY),
        "supabase_connected": True,  # We'll update this when we test the connection
        "mode": "authenticated" if AUTH_REQUIRED else "anonymous_optional"
    }


# Protected route example
@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    """Example protected route that requires authentication."""
    return {
        "message": f"Hello {current_user.name}!",
        "user_id": current_user.id,
        "is_premium": current_user.is_premium,
    }

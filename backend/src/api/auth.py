"""
Authentication endpoints for PixelPrep using Supabase Auth and GitHub OAuth.
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Request, Response
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import requests
from pydantic import BaseModel

from ..storage.supabase_client import get_supabase_client

# Router for auth endpoints
router = APIRouter(prefix="/auth", tags=["authentication"])

# Security scheme
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# GitHub OAuth Configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


# Pydantic Models
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


class User(BaseModel):
    id: str
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    subscription_tier: Optional[str] = None  # subscription tier
    created_at: datetime
    updated_at: datetime


# JWT Token Functions
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """Verify JWT token and return user data."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None:
            raise credentials_exception
            
        token_data = TokenData(user_id=user_id, email=email)
        return token_data
        
    except JWTError:
        raise credentials_exception


async def get_current_user(token_data: TokenData = Depends(verify_token)) -> User:
    """Get current user from token data."""
    try:
        supabase = get_supabase_client()
        
        # Get user from database
        response = supabase.table("profiles").select("*").eq("id", token_data.user_id).single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return User(**response.data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate user: {str(e)}"
        )


def verify_optional_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)) -> Optional[TokenData]:
    """Verify JWT token optionally (returns None if no token provided)."""
    if credentials is None:
        return None
        
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None:
            return None
            
        return TokenData(user_id=user_id, email=email)
        
    except JWTError:
        return None


async def get_current_user_optional(token_data: Optional[TokenData] = Depends(verify_optional_token)) -> Optional[User]:
    """Get current user from token data, or None if not authenticated."""
    if token_data is None:
        return None
        
    try:
        supabase = get_supabase_client()
        
        # Get user from database
        response = supabase.table("profiles").select("*").eq("id", token_data.user_id).single().execute()
        
        if not response.data:
            return None
        
        return User(**response.data)
        
    except Exception:
        return None


# Auth Endpoints
@router.get("/github/login")
async def github_login(request: Request):
    """Initiate GitHub OAuth flow."""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth not configured"
        )
    
    # Generate state parameter for security
    state = secrets.token_urlsafe(32)
    
    # Store state in session (in production, use Redis or database)
    # For now, we'll include it in the redirect and validate on callback
    
    github_oauth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={GITHUB_CLIENT_ID}&"
        f"redirect_uri={request.base_url}auth/github/callback&"
        f"scope=user:email&"
        f"state={state}"
    )
    
    return {"auth_url": github_oauth_url, "state": state}


@router.get("/github/callback")
async def github_callback(request: Request, code: str, state: str = None):
    """Handle GitHub OAuth callback."""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth not configured"
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
            timeout=10
        )
        
        token_response.raise_for_status()
        token_data = token_response.json()
        
        if "access_token" not in token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get access token from GitHub"
            )
        
        github_token = token_data["access_token"]
        
        # Get user info from GitHub
        user_response = requests.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github.v3+json"
            },
            timeout=10
        )
        
        user_response.raise_for_status()
        github_user = user_response.json()
        
        # Get user's primary email
        email_response = requests.get(
            "https://api.github.com/user/emails",
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github.v3+json"
            },
            timeout=10
        )
        
        email_response.raise_for_status()
        emails = email_response.json()
        primary_email = next((email["email"] for email in emails if email["primary"]), github_user.get("email"))
        
        # Create or sign in user with Supabase Auth
        supabase = get_supabase_client()
        
        try:
            # Try to sign in with email (user might already exist)
            auth_response = supabase.auth.sign_in_with_password({
                "email": primary_email,
                "password": f"github_oauth_{github_user['id']}"  # Temporary password pattern
            })
            user_id = auth_response.user.id
            print(f"User signed in: {user_id}")
            
        except Exception as signin_error:
            print(f"Sign in failed, creating new user: {signin_error}")
            
            # User doesn't exist, create via Auth
            try:
                auth_response = supabase.auth.sign_up({
                    "email": primary_email,
                    "password": f"github_oauth_{github_user['id']}",  # Temporary password
                    "options": {
                        "data": {
                            "display_name": github_user.get("name") or github_user.get("login"),
                            "avatar_url": github_user.get("avatar_url"),
                            "provider": "github"
                        }
                    }
                })
                user_id = auth_response.user.id
                print(f"New user created: {user_id}")
                
                # Create corresponding profile record (since no auto-trigger exists)
                try:
                    profile_data = {
                        "id": str(user_id),  # Use the auth user ID
                        "email": primary_email,
                        "display_name": github_user.get("name") or github_user.get("login"),
                        "avatar_url": github_user.get("avatar_url")
                    }
                    
                    profile_result = supabase.table("profiles").insert(profile_data).execute()
                    print(f"Profile created: {profile_result.data[0]['id'] if profile_result.data else 'unknown'}")
                    
                except Exception as profile_error:
                    print(f"Profile creation failed: {profile_error}")
                    # Don't fail the entire auth flow - user is created in auth system
                
            except Exception as signup_error:
                print(f"Signup failed: {signup_error}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to create user account: {str(signup_error)}"
                )
        
        # Also ensure profile exists for sign-in case
        try:
            existing_profile = supabase.table("profiles").select("*").eq("id", str(user_id)).execute()
            if not existing_profile.data:
                print(f"Creating missing profile for existing user: {user_id}")
                profile_data = {
                    "id": str(user_id),
                    "email": primary_email,
                    "display_name": github_user.get("name") or github_user.get("login"),
                    "avatar_url": github_user.get("avatar_url")
                }
                supabase.table("profiles").insert(profile_data).execute()
                print(f"Profile created for existing user")
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
                "github_username": github_user.get("login")
            }
        }
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GitHub OAuth failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
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
        "github_oauth": github_configured,
        "jwt_configured": bool(JWT_SECRET_KEY),
        "supabase_connected": True  # We'll update this when we test the connection
    }


# Protected route example
@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    """Example protected route that requires authentication."""
    return {
        "message": f"Hello {current_user.name}!",
        "user_id": current_user.id,
        "is_premium": current_user.is_premium
    }
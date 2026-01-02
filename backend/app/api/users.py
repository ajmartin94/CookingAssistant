"""
Users API

API endpoints for user registration, authentication, and profile management.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserUpdate, Token
from app.services.auth_service import (
    create_user,
    authenticate_user,
    create_access_token,
    get_user_by_username,
    get_user_by_email,
    get_password_hash,
)
from app.utils.dependencies import CurrentUser

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_create: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Register a new user

    - **username**: Unique username (3-50 characters)
    - **email**: Valid email address
    - **password**: Password (minimum 8 characters)
    - **full_name**: Optional full name
    """
    # Check if username already exists
    existing_user = await get_user_by_username(db, user_create.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    # Check if email already exists
    existing_email = await get_user_by_email(db, user_create.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    user = await create_user(db, user_create)
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Login with username and password to get access token

    Returns JWT token for subsequent authenticated requests.
    """
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id}
    )

    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: CurrentUser):
    """
    Get current user's profile

    Requires authentication.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Update current user's profile

    - **email**: New email address
    - **full_name**: New full name
    - **password**: New password

    Requires authentication.
    """
    update_data = user_update.model_dump(exclude_unset=True)

    # Check if email is being updated and is already taken
    if "email" in update_data:
        existing_email = await get_user_by_email(db, update_data["email"])
        if existing_email and existing_email.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )

    # Hash password if being updated
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    # Update user fields
    for key, value in update_data.items():
        setattr(current_user, key, value)

    await db.commit()
    await db.refresh(current_user)
    return current_user

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.database.database import get_db
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
)
from app.services import user_service


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    try:
        new_user = user_service.create_user(db, user)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Cet email est déjà utilisé"
        )

    token = create_access_token(new_user.id)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=new_user,
    )


@router.post("/login", response_model=TokenResponse)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    user = user_service.authenticate_user(
        db,
        credentials.email,
        credentials.password
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email ou mot de passe incorrect"
        )

    token = create_access_token(user.id)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user,
    )
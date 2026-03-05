from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlite3 import Connection, IntegrityError

from ..db import get_connection
from ..models.user import get_user_by_username, create_user
from ..schemas.user import UserCreate, UserRead, Token
from ..auth import hash_password, verify_password, create_access_token, get_current_user

auth_router = APIRouter(prefix="/auth", tags=["Auth"])

@auth_router.post("/register", response_model=UserRead, status_code=201)
def register(new: UserCreate, conn: Connection = Depends(get_connection)):
    try:
        user = create_user(new.username, hash_password(new.password), conn)
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Username already taken")
    return user

@auth_router.post("/token", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), conn: Connection = Depends(get_connection)):
    user = get_user_by_username(form.username, conn)
    if not user or not verify_password(form.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user["username"]})
    return {"access_token": token, "token_type": "bearer"}

@auth_router.post("/logout", status_code=200)
def logout(current_user=Depends(get_current_user)):
    return {"detail": "Logged out successfully"}

from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlite3 import Connection
import os

from .db import get_connection
from .models.user import get_user_by_username

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
PUBLIC_SEED_USER = os.environ.get("FT_PUBLIC_SEED_USER") or os.environ.get("FT_PUBLIC_DEMO_USER") or "public"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")
oauth2_optional_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
        token: str = Depends(oauth2_scheme),
        conn: Connection = Depends(get_connection)
    ):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc
    user = get_user_by_username(username, conn)
    if user is None:
        raise credentials_exception
    return user


def get_optional_user(
        token: str | None = Depends(oauth2_optional_scheme),
        conn: Connection = Depends(get_connection)
    ):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            return None
    except JWTError as exc:
        _ = exc
        return None
    return get_user_by_username(username, conn)


def get_request_user(
        user=Depends(get_optional_user),
        conn: Connection = Depends(get_connection)
    ):
    if user is not None:
        return user
    public_user = get_user_by_username(PUBLIC_SEED_USER, conn)
    if public_user is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Public seeded data is not available yet",
        )
    return public_user
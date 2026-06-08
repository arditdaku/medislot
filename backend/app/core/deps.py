"""FastAPI dependencies for authentication and request-scoped resources."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

# Extracts the Bearer token from the Authorization header.
# tokenUrl points at the login endpoint (to be implemented by a teammate).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from a Bearer JWT.

    Raises 401 if the token is missing, invalid, or expired, or if the
    referenced user does not exist.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # decode_access_token returns None on any invalid/expired token.
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exc

    # Contract with the login endpoint: the user id is stored in "sub".
    subject = payload.get("sub")
    if subject is None:
        raise credentials_exc

    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        raise credentials_exc

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exc

    return user

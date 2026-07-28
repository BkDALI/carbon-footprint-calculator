import os
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt


# En production, définissez cette variable dans Render.
# Ne mettez jamais une vraie clé secrète dans le frontend.
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "CHANGE-ME-IN-RENDER-USE-A-LONG-RANDOM-SECRET"
)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        subject = payload.get("sub")

        if subject is None:
            raise ValueError("Token invalide")

        return int(subject)

    except (JWTError, ValueError, TypeError):
        raise ValueError("Token invalide")
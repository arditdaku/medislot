"""Seed script that ensures a default admin account exists.

The admin user is created ONLY through this script (never via the public
/auth/register flow), so every teammate who runs the app locally starts with
the same admin to log in with and manage doctors, services, slots, etc.

Run it from the ``backend`` directory:

    python -m app.seed

It is idempotent: running it again will not create duplicates.
"""

import sys
from pathlib import Path

# Allow running directly (``python app/seed.py``) as well as ``python -m app.seed``.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.security import hash_password
from app.models.user import User

ADMIN_FULL_NAME = "Admin"
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "admin12345"


def seed_admin(db: Session) -> None:
    """Create the default admin account if it does not already exist."""
    existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if existing:
        print(f"Admin already exists: {ADMIN_EMAIL} (id={existing.id}) - skipping.")
        return

    admin = User(
        full_name=ADMIN_FULL_NAME,
        email=ADMIN_EMAIL,
        password_hash=hash_password(ADMIN_PASSWORD),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"Created admin: {ADMIN_EMAIL} / {ADMIN_PASSWORD} (id={admin.id})")


def main() -> None:
    db = SessionLocal()
    try:
        seed_admin(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()

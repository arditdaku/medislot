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
from app.models.service import Service
from app.models.user import User

ADMIN_FULL_NAME = "Admin"
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "admin12345"

# Baseline services every environment should have. `department` is what links a
# doctor's specialty to the patient booking flow, so each service introduces a
# bookable department. Seeded alongside the admin and never auto-deleted.
DEFAULT_SERVICES = [
    {"name": "General Consultation", "duration_minutes": 30, "department": "General Medicine"},
    {"name": "Cardiology Consultation", "duration_minutes": 30, "department": "Cardiology"},
    {"name": "Dermatology Consultation", "duration_minutes": 30, "department": "Dermatology"},
    {"name": "Neurology Consultation", "duration_minutes": 45, "department": "Neurology"},
    {"name": "Pediatrics Consultation", "duration_minutes": 30, "department": "Pediatrics"},
    {"name": "Dental Check-up", "duration_minutes": 30, "department": "Dentistry"},
]


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


def seed_services(db: Session) -> None:
    """Create the baseline services if they don't already exist (idempotent)."""
    created = 0
    for spec in DEFAULT_SERVICES:
        exists = db.query(Service).filter(Service.name == spec["name"]).first()
        if exists:
            continue
        db.add(Service(**spec))
        created += 1
    db.commit()
    total = db.query(Service).count()
    print(f"Seeded {created} new service(s); {total} total.")


def main() -> None:
    db = SessionLocal()
    try:
        seed_admin(db)
        seed_services(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()

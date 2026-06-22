"""Tests for slot-generation duplicate prevention (SCRUM-120).

Regression coverage for the bug where changing the slot duration and generating
again created a second, overlapping set of slots for the same doctor and date.
A day that already has slots must be left untouched.

Follows the direct-function-call style of test_doctor_schedule.py — the project's
tests call the route functions directly rather than going through the HTTP layer.
"""
import sys
import unittest
from datetime import date
from pathlib import Path
from uuid import uuid4

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal
from app.models.provider import Provider
from app.models.slot import AppointmentSlot
from app.models.user import User
from app.routes.slots import generate_slots
from app.schemas.slot import SlotGenerate


GEN_DATE = date(2030, 6, 3)
# Empty working_hours => default 09:00-17:00 window => 16 thirty-minute slots.
EXPECTED_30_MIN_SLOTS = 16


class SlotGenerationDuplicateTest(unittest.TestCase):
    def setUp(self):
        self.marker = uuid4().hex
        self.created_user_ids = []
        self.created_provider_ids = []
        db = SessionLocal()
        try:
            admin_user = User(
                email=f"slotgen-admin-{self.marker}@example.test",
                password_hash="test",
                role="admin",
                full_name="Admin Gen",
            )
            doctor_user = User(
                email=f"slotgen-doctor-{self.marker}@example.test",
                password_hash="test",
                role="doctor",
                full_name="Dr. Gen",
            )
            db.add_all([admin_user, doctor_user])
            db.flush()
            provider = Provider(
                user_id=doctor_user.id, specialty="Gen", working_hours={}
            )
            db.add(provider)
            db.commit()

            self.admin_user_id = admin_user.id
            self.provider_id = provider.id
            self.created_user_ids = [admin_user.id, doctor_user.id]
            self.created_provider_ids = [provider.id]
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def tearDown(self):
        db = SessionLocal()
        try:
            db.query(AppointmentSlot).filter(
                AppointmentSlot.provider_id.in_(self.created_provider_ids)
            ).delete(synchronize_session=False)
            db.query(Provider).filter(
                Provider.id.in_(self.created_provider_ids)
            ).delete(synchronize_session=False)
            db.query(User).filter(
                User.id.in_(self.created_user_ids)
            ).delete(synchronize_session=False)
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def _generate(self, duration_minutes):
        db = SessionLocal()
        try:
            admin = (
                db.query(User).filter(User.id == self.admin_user_id).first()
            )
            return generate_slots(
                request=SlotGenerate(
                    provider_id=self.provider_id,
                    date=GEN_DATE,
                    slot_duration_minutes=duration_minutes,
                ),
                db=db,
                current_user=admin,
            )
        finally:
            db.close()

    def _day_slot_count(self):
        db = SessionLocal()
        try:
            return (
                db.query(AppointmentSlot)
                .filter(AppointmentSlot.provider_id == self.provider_id)
                .count()
            )
        finally:
            db.close()

    def test_first_generate_creates_slots(self):
        created = self._generate(30)
        self.assertEqual(len(created), EXPECTED_30_MIN_SLOTS)
        self.assertEqual(self._day_slot_count(), EXPECTED_30_MIN_SLOTS)

    def test_changing_duration_does_not_duplicate(self):
        first = self._generate(30)
        self.assertEqual(len(first), EXPECTED_30_MIN_SLOTS)

        # Re-generating the same day with a different duration must create
        # nothing and leave the original schedule untouched (no overlaps).
        second = self._generate(45)
        self.assertEqual(second, [])
        self.assertEqual(self._day_slot_count(), EXPECTED_30_MIN_SLOTS)

    def test_same_duration_is_idempotent(self):
        self._generate(30)
        again = self._generate(30)
        self.assertEqual(again, [])
        self.assertEqual(self._day_slot_count(), EXPECTED_30_MIN_SLOTS)


if __name__ == "__main__":
    unittest.main()

"""Tests for POST /visit-records (visit record creation).

Tests:
- Successful creation of a visit record
- Duplicate visit record for the same appointment raises IntegrityError (409 at endpoint)
- Doctor ownership note (enforced at endpoint level, not model level)
"""

import sys
import unittest
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from sqlalchemy.exc import IntegrityError

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.provider import Provider
from app.models.service import Service
from app.models.slot import AppointmentSlot, SlotStatus
from app.models.user import User
from app.models.visit_record import VisitRecord


class VisitRecordCreateTest(unittest.TestCase):
    """Tests for creating visit records."""

    def setUp(self):
        """Set up test data with a doctor, another doctor, a patient, and appointments."""
        self.marker = uuid4().hex
        self._seed()

    def _seed(self):
        """Create test users, providers, a patient, a service, slots, and appointments."""
        db = SessionLocal()
        try:
            doctor_user = User(
                email=f"doctor-{self.marker}@example.test",
                password_hash="test",
                role="doctor",
                full_name="Dr. Test",
            )
            other_doctor_user = User(
                email=f"other-doctor-{self.marker}@example.test",
                password_hash="test",
                role="doctor",
                full_name="Dr. Other",
            )
            patient_user = User(
                email=f"patient-{self.marker}@example.test",
                password_hash="test",
                role="patient",
                full_name="Patient Test",
            )
            service = Service(
                name=f"Visit Test Service {self.marker}",
                duration_minutes=30,
                department="Tests",
            )
            db.add_all([doctor_user, other_doctor_user, patient_user, service])
            db.flush()

            provider = Provider(
                user_id=doctor_user.id,
                specialty="General",
                working_hours={},
            )
            other_provider = Provider(
                user_id=other_doctor_user.id,
                specialty="Other",
                working_hours={},
            )
            patient = Patient(
                user_id=patient_user.id,
                full_name="Patient Test",
                dob=date(1990, 1, 1),
                phone="0000000000",
                address="test",
            )
            db.add_all([provider, other_provider, patient])
            db.flush()

            self.doctor_user_id = doctor_user.id
            self.other_doctor_user_id = other_doctor_user.id
            self.patient_user_id = patient_user.id
            self.provider_id = provider.id
            self.other_provider_id = other_provider.id
            self.patient_id = patient.id
            self.service_id = service.id

            base_time = datetime.now(timezone.utc) + timedelta(days=1)
            doctor_slot = AppointmentSlot(
                provider_id=provider.id,
                start_time=base_time,
                end_time=base_time + timedelta(minutes=30),
                status=SlotStatus.booked,
            )
            other_doctor_slot = AppointmentSlot(
                provider_id=other_provider.id,
                start_time=base_time + timedelta(hours=1),
                end_time=base_time + timedelta(hours=1, minutes=30),
                status=SlotStatus.booked,
            )
            db.add_all([doctor_slot, other_doctor_slot])
            db.flush()

            self.doctor_slot_id = doctor_slot.id
            self.other_doctor_slot_id = other_doctor_slot.id

            doctor_appointment = Appointment(
                patient_id=patient.id,
                slot_id=doctor_slot.id,
                service_id=service.id,
                status=AppointmentStatus.completed,
            )
            other_appointment = Appointment(
                patient_id=patient.id,
                slot_id=other_doctor_slot.id,
                service_id=service.id,
                status=AppointmentStatus.completed,
            )
            db.add_all([doctor_appointment, other_appointment])
            db.commit()

            self.doctor_appointment_id = doctor_appointment.id
            self.other_appointment_id = other_appointment.id
        finally:
            db.close()

    def test_create_visit_record_success(self):
        """A visit record can be created for a completed appointment."""
        db = SessionLocal()
        try:
            visit_record = VisitRecord(
                appointment_id=self.doctor_appointment_id,
                doctor_id=self.provider_id,
                notes="Patient presented with mild symptoms.",
            )
            db.add(visit_record)
            db.commit()
            db.refresh(visit_record)

            assert visit_record.id is not None
            assert visit_record.appointment_id == self.doctor_appointment_id
            assert visit_record.doctor_id == self.provider_id
            assert visit_record.ai_summary is None
        finally:
            db.close()

    def test_duplicate_visit_record_blocked(self):
        """A second visit record for the same appointment raises IntegrityError.

        The POST endpoint catches this and returns 409.
        """
        db = SessionLocal()
        try:
            first = VisitRecord(
                appointment_id=self.other_appointment_id,
                doctor_id=self.other_provider_id,
                notes="First note.",
            )
            db.add(first)
            db.commit()

            duplicate = VisitRecord(
                appointment_id=self.other_appointment_id,
                doctor_id=self.other_provider_id,
                notes="Second note.",
            )
            db.add(duplicate)
            with self.assertRaises(IntegrityError):
                db.commit()
        finally:
            db.rollback()
            db.close()

    def test_doctor_ownership_check_data(self):
        """Note: Direct database access allows any doctor_id (no model-level validation).

        The POST endpoint enforces ownership by checking the appointment's
        slot.provider_id against the authenticated doctor's provider profile
        (403 otherwise). This test only verifies the underlying data shape
        that the endpoint relies on for that check.
        """
        db = SessionLocal()
        try:
            slot = db.query(AppointmentSlot).filter(
                AppointmentSlot.id == self.other_doctor_slot_id
            ).first()
            assert slot.provider_id == self.other_provider_id
            assert slot.provider_id != self.provider_id
        finally:
            db.close()

    def test_fetch_visit_record_by_appointment_id(self):
        """A visit record can be looked up by appointment_id."""
        db = SessionLocal()
        try:
            visit_record = VisitRecord(
                appointment_id=self.doctor_appointment_id,
                doctor_id=self.provider_id,
                notes="Visit notes for fetch test.",
            )
            db.add(visit_record)
            db.commit()

            fetched = (
                db.query(VisitRecord)
                .filter(VisitRecord.appointment_id == self.doctor_appointment_id)
                .first()
            )
            assert fetched is not None
            assert fetched.notes == "Visit notes for fetch test."
        finally:
            db.close()

    def test_fetch_visit_record_not_found_returns_none(self):
        """No visit record exists yet for this appointment (404 at endpoint)."""
        db = SessionLocal()
        try:
            fetched = (
                db.query(VisitRecord)
                .filter(VisitRecord.appointment_id == self.other_appointment_id)
                .first()
            )
            assert fetched is None
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
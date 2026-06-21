"""Tests for PUT /providers/{id} and DELETE /providers/{id}.

Tests the provider update and delete endpoints with:
- Valid partial updates (specialty, working_hours)
- Role-based access control (admin, doctor)
- Doctor ownership validation (doctors only update their own)
- 404 handling for nonexistent providers
- Delete: success, 403 for doctors, 409 when appointments exist
"""
import datetime as dt
import sys
import unittest
from pathlib import Path
from uuid import uuid4

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import HTTPException

from app.db.session import SessionLocal
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.provider import Provider
from app.models.service import Service
from app.models.slot import AppointmentSlot, SlotStatus
from app.models.user import User
from app.routes.providers import update_provider, delete_provider
from app.schemas.provider import ProviderUpdate


class ProviderUpdateTest(unittest.TestCase):
    """Tests for updating and deactivating providers."""

    def setUp(self):
        """Set up test data with doctors, admin, and providers."""
        self.marker = uuid4().hex
        self._seed()

    def _seed(self):
        """Create test users and providers."""
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
            admin_user = User(
                email=f"admin-{self.marker}@example.test",
                password_hash="test",
                role="admin",
                full_name="Admin Test",
            )
            db.add_all([doctor_user, other_doctor_user, admin_user])
            db.flush()

            provider = Provider(
                user_id=doctor_user.id,
                specialty="General",
                working_hours={"mon": ["09:00-17:00"]},
                experience=5,
                fees=50.0,
                address="Test Address 1",
                about="Test bio",
                is_active=True,
            )
            other_provider = Provider(
                user_id=other_doctor_user.id,
                specialty="Other",
                working_hours={},
                experience=3,
                fees=40.0,
                address="Test Address 2",
                about="Other bio",
                is_active=True,
            )
            db.add_all([provider, other_provider])
            db.commit()

            self.doctor_user_id = doctor_user.id
            self.other_doctor_user_id = other_doctor_user.id
            self.admin_user_id = admin_user.id
            self.provider_id = provider.id
            self.other_provider_id = other_provider.id
        finally:
            db.close()

    def test_admin_can_update_any_provider(self):
        """Test that an admin can update any provider's details."""
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.id == self.admin_user_id).first()
            payload = ProviderUpdate(specialty="Cardiology")

            result = update_provider(self.provider_id, payload, db, current_user=admin)

            assert result.specialty == "Cardiology"
        finally:
            db.close()

    def test_doctor_can_update_own_provider(self):
        """Test that a doctor can update their own provider record."""
        db = SessionLocal()
        try:
            doctor = db.query(User).filter(User.id == self.doctor_user_id).first()
            payload = ProviderUpdate(specialty="Dermatology")

            result = update_provider(self.provider_id, payload, db, current_user=doctor)

            assert result.specialty == "Dermatology"
        finally:
            db.close()

    def test_doctor_cannot_update_other_provider(self):
        """Test that a doctor cannot update another doctor's provider record (403)."""
        db = SessionLocal()
        try:
            doctor = db.query(User).filter(User.id == self.doctor_user_id).first()
            payload = ProviderUpdate(specialty="Neurology")

            with self.assertRaises(HTTPException) as ctx:
                update_provider(self.other_provider_id, payload, db, current_user=doctor)

            assert ctx.exception.status_code == 403
        finally:
            db.close()

    def test_update_nonexistent_provider_returns_404(self):
        """Test that updating a nonexistent provider returns 404."""
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.id == self.admin_user_id).first()
            payload = ProviderUpdate(specialty="Cardiology")

            with self.assertRaises(HTTPException) as ctx:
                update_provider(999999, payload, db, current_user=admin)

            assert ctx.exception.status_code == 404
        finally:
            db.close()

    def test_partial_update_only_changes_provided_fields(self):
        """Test that omitted fields are left unchanged (exclude_unset)."""
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.id == self.admin_user_id).first()
            payload = ProviderUpdate(working_hours={"tue": ["10:00-18:00"]})

            result = update_provider(self.provider_id, payload, db, current_user=admin)

            assert result.specialty == "General"
            assert result.working_hours == {"tue": ["10:00-18:00"]}
        finally:
            db.close()

    def test_admin_can_update_fees_address_about(self):
        """Test that the newer fields (fees, address, about) can be updated too."""
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.id == self.admin_user_id).first()
            payload = ProviderUpdate(fees=75, address="New Address", about="Updated bio")

            result = update_provider(self.provider_id, payload, db, current_user=admin)

            assert result.fees == 75
            assert result.address == "New Address"
            assert result.about == "Updated bio"
            assert result.specialty == "General"
        finally:
            db.close()

    def test_admin_can_delete_provider(self):
        """An admin can delete a doctor with no appointments; the provider and
        their login account are both removed."""
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.id == self.admin_user_id).first()

            result = delete_provider(self.provider_id, db, admin)

            assert result is None
            assert (
                db.query(Provider).filter(Provider.id == self.provider_id).first()
                is None
            )
            assert (
                db.query(User).filter(User.id == self.doctor_user_id).first()
                is None
            )
        finally:
            db.close()

    def test_delete_blocked_when_appointments_exist(self):
        """Deleting a doctor with appointments on record returns 409."""
        db = SessionLocal()
        try:
            patient_user = User(
                email=f"patient-{self.marker}@example.test",
                password_hash="test",
                role="patient",
                full_name="Pat Test",
            )
            db.add(patient_user)
            db.flush()
            patient = Patient(
                user_id=patient_user.id,
                full_name="Pat Test",
                dob=dt.date(1990, 1, 1),
                phone="123",
                address="Addr",
            )
            service = Service(
                name=f"Service-{self.marker}",
                duration_minutes=30,
                department="General",
            )
            db.add_all([patient, service])
            db.flush()

            start = dt.datetime.now() + dt.timedelta(days=1)
            slot = AppointmentSlot(
                provider_id=self.provider_id,
                start_time=start,
                end_time=start + dt.timedelta(minutes=30),
                status=SlotStatus.booked,
            )
            db.add(slot)
            db.flush()
            db.add(
                Appointment(
                    patient_id=patient.id,
                    slot_id=slot.id,
                    service_id=service.id,
                    status=AppointmentStatus.waiting,
                )
            )
            db.commit()

            admin = db.query(User).filter(User.id == self.admin_user_id).first()
            with self.assertRaises(HTTPException) as ctx:
                delete_provider(self.provider_id, db, admin)

            assert ctx.exception.status_code == 409
        finally:
            db.close()

    def test_doctor_cannot_delete_provider(self):
        """A doctor (even the owner) cannot delete a provider (403)."""
        db = SessionLocal()
        try:
            doctor = db.query(User).filter(User.id == self.doctor_user_id).first()

            with self.assertRaises(HTTPException) as ctx:
                delete_provider(self.provider_id, db, doctor)

            assert ctx.exception.status_code == 403
        finally:
            db.close()

    def test_delete_nonexistent_provider_returns_404(self):
        """Deleting a nonexistent provider returns 404."""
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.id == self.admin_user_id).first()

            with self.assertRaises(HTTPException) as ctx:
                delete_provider(999999, db, admin)

            assert ctx.exception.status_code == 404
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
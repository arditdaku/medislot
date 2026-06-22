"""Tests for GET /doctor/visits (SCRUM-119).

Seeds two doctors with visit records and verifies the endpoint returns only
the logged-in doctor's rows, enriches patient/service/date fields, orders
newest appointment first, and supports optional patient-name search.
"""
import sys
import unittest
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

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
from app.routes.doctor import get_visits


class DoctorVisitsTest(unittest.TestCase):
    def setUp(self):
        self.marker = uuid4().hex
        self.created_visit_ids = []
        self.created_appointment_ids = []
        self.created_slot_ids = []
        self.created_provider_ids = []
        self.created_patient_ids = []
        self.created_service_ids = []
        self.created_user_ids = []
        self._seed()

    def _seed(self):
        db = SessionLocal()
        try:
            doctor_user = User(
                email=f"visits-doctor-{self.marker}@example.test",
                password_hash="test",
                role="doctor",
                full_name="Dr. Visits",
            )
            other_user = User(
                email=f"visits-other-{self.marker}@example.test",
                password_hash="test",
                role="doctor",
                full_name="Dr. Other",
            )
            patient_a_user = User(
                email=f"visits-patient-a-{self.marker}@example.test",
                password_hash="test",
                role="patient",
                full_name="Alice Alpha",
            )
            patient_b_user = User(
                email=f"visits-patient-b-{self.marker}@example.test",
                password_hash="test",
                role="patient",
                full_name="Bob Beta",
            )
            service = Service(
                name=f"Visits Service {self.marker}",
                duration_minutes=30,
                department="Tests",
            )
            db.add_all(
                [doctor_user, other_user, patient_a_user, patient_b_user, service]
            )
            db.flush()

            provider = Provider(
                user_id=doctor_user.id, specialty="Visits", working_hours={}
            )
            other_provider = Provider(
                user_id=other_user.id, specialty="Other", working_hours={}
            )
            patient_a = Patient(
                user_id=patient_a_user.id,
                full_name="Alice Alpha",
                dob=date(1990, 1, 1),
                phone="0000000000",
                address="test",
            )
            patient_b = Patient(
                user_id=patient_b_user.id,
                full_name="Bob Beta",
                dob=date(1991, 2, 2),
                phone="0000000001",
                address="test",
            )
            db.add_all([provider, other_provider, patient_a, patient_b])
            db.flush()

            base = datetime.now(timezone.utc) - timedelta(days=2)
            older_slot = AppointmentSlot(
                provider_id=provider.id,
                start_time=base,
                end_time=base + timedelta(minutes=30),
                status=SlotStatus.booked,
            )
            newer_slot = AppointmentSlot(
                provider_id=provider.id,
                start_time=base + timedelta(days=1),
                end_time=base + timedelta(days=1, minutes=30),
                status=SlotStatus.booked,
            )
            other_slot = AppointmentSlot(
                provider_id=other_provider.id,
                start_time=base + timedelta(days=1),
                end_time=base + timedelta(days=1, minutes=30),
                status=SlotStatus.booked,
            )
            db.add_all([older_slot, newer_slot, other_slot])
            db.flush()

            older_appt = Appointment(
                patient_id=patient_a.id,
                slot_id=older_slot.id,
                service_id=service.id,
                status=AppointmentStatus.completed,
            )
            newer_appt = Appointment(
                patient_id=patient_b.id,
                slot_id=newer_slot.id,
                service_id=service.id,
                status=AppointmentStatus.completed,
            )
            other_appt = Appointment(
                patient_id=patient_a.id,
                slot_id=other_slot.id,
                service_id=service.id,
                status=AppointmentStatus.completed,
            )
            db.add_all([older_appt, newer_appt, other_appt])
            db.flush()

            older_record = VisitRecord(
                appointment_id=older_appt.id,
                doctor_id=provider.id,
                notes="Older visit notes for Alice.",
            )
            newer_record = VisitRecord(
                appointment_id=newer_appt.id,
                doctor_id=provider.id,
                notes="Newer visit notes for Bob.",
            )
            other_record = VisitRecord(
                appointment_id=other_appt.id,
                doctor_id=other_provider.id,
                notes="Other doctor's notes.",
            )
            db.add_all([older_record, newer_record, other_record])
            db.commit()

            self.doctor_user = doctor_user
            self.service_name = service.name
            self.created_user_ids = [
                doctor_user.id,
                other_user.id,
                patient_a_user.id,
                patient_b_user.id,
            ]
            self.created_provider_ids = [provider.id, other_provider.id]
            self.created_patient_ids = [patient_a.id, patient_b.id]
            self.created_service_ids = [service.id]
            self.created_slot_ids = [older_slot.id, newer_slot.id, other_slot.id]
            self.created_appointment_ids = [
                older_appt.id,
                newer_appt.id,
                other_appt.id,
            ]
            self.created_visit_ids = [
                older_record.id,
                newer_record.id,
                other_record.id,
            ]
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def tearDown(self):
        db = SessionLocal()
        try:
            db.query(VisitRecord).filter(
                VisitRecord.id.in_(self.created_visit_ids)
            ).delete(synchronize_session=False)
            db.query(Appointment).filter(
                Appointment.id.in_(self.created_appointment_ids)
            ).delete(synchronize_session=False)
            db.query(AppointmentSlot).filter(
                AppointmentSlot.id.in_(self.created_slot_ids)
            ).delete(synchronize_session=False)
            db.query(Provider).filter(
                Provider.id.in_(self.created_provider_ids)
            ).delete(synchronize_session=False)
            db.query(Patient).filter(
                Patient.id.in_(self.created_patient_ids)
            ).delete(synchronize_session=False)
            db.query(Service).filter(
                Service.id.in_(self.created_service_ids)
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

    def test_returns_only_logged_in_doctors_visits(self):
        db = SessionLocal()
        try:
            result = get_visits(db=db, current_user=self.doctor_user)
        finally:
            db.close()

        self.assertEqual(len(result), 2)
        patient_names = {row.patient_name for row in result}
        self.assertEqual(patient_names, {"Alice Alpha", "Bob Beta"})

    def test_rows_are_enriched_and_sorted_newest_first(self):
        db = SessionLocal()
        try:
            result = get_visits(db=db, current_user=self.doctor_user)
        finally:
            db.close()

        self.assertEqual(result[0].patient_name, "Bob Beta")
        self.assertEqual(result[0].notes, "Newer visit notes for Bob.")
        self.assertEqual(result[0].service_name, self.service_name)
        self.assertIsNotNone(result[0].appointment_date)

        self.assertEqual(result[1].patient_name, "Alice Alpha")
        self.assertGreater(
            result[0].appointment_date, result[1].appointment_date
        )

    def test_search_filters_by_patient_name(self):
        db = SessionLocal()
        try:
            result = get_visits(
                search="Alice", db=db, current_user=self.doctor_user
            )
        finally:
            db.close()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].patient_name, "Alice Alpha")

    def test_empty_when_doctor_has_no_provider(self):
        db = SessionLocal()
        try:
            orphan = User(
                email=f"visits-orphan-{self.marker}@example.test",
                password_hash="test",
                role="doctor",
                full_name="Dr. Orphan",
            )
            db.add(orphan)
            db.commit()
            db.refresh(orphan)

            result = get_visits(db=db, current_user=orphan)
            self.assertEqual(result, [])

            db.delete(orphan)
            db.commit()
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
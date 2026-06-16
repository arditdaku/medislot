"""Tests for GET /doctor/schedule (SCRUM-97).

Seeds a doctor with three slots on one day — one available, one booked, one
blocked — and verifies the endpoint returns all three for the logged-in doctor,
enriches the booked slot with patient + service names, scopes results to the
calling doctor, and rejects an invalid date with 422.

Follows the direct-function-call style of test_concurrency.py (the project's
tests do not depend on httpx / FastAPI's TestClient). The 422 case necessarily
exercises the HTTP layer, so it is skipped when httpx is unavailable.
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
from app.routes.doctor import get_schedule


SCHEDULE_DATE = date(2030, 5, 17)


class DoctorScheduleTest(unittest.TestCase):
    def setUp(self):
        self.marker = uuid4().hex
        self.created_user_ids = []
        self.created_provider_ids = []
        self.created_patient_ids = []
        self.created_slot_ids = []
        self.created_appointment_ids = []
        self.created_service_ids = []
        self._seed()

    def _seed(self):
        db = SessionLocal()
        try:
            doctor_user = User(
                email=f"sched-doctor-{self.marker}@example.test",
                password_hash="test",
                role="doctor",
                full_name="Dr. Schedule",
            )
            # A second, unrelated doctor whose slots must NOT appear.
            other_user = User(
                email=f"sched-other-{self.marker}@example.test",
                password_hash="test",
                role="doctor",
                full_name="Dr. Other",
            )
            patient_user = User(
                email=f"sched-patient-{self.marker}@example.test",
                password_hash="test",
                role="patient",
                full_name="Pat Patient",
            )
            service = Service(
                name=f"Schedule Service {self.marker}",
                duration_minutes=30,
                department="Tests",
            )
            db.add_all([doctor_user, other_user, patient_user, service])
            db.flush()

            provider = Provider(user_id=doctor_user.id, specialty="Schedule", working_hours={})
            other_provider = Provider(user_id=other_user.id, specialty="Other", working_hours={})
            patient = Patient(
                user_id=patient_user.id,
                full_name="Pat Patient",
                dob=date(1990, 1, 1),
                phone="0000000000",
                address="test",
            )
            db.add_all([provider, other_provider, patient])
            db.flush()

            base = datetime.combine(
                SCHEDULE_DATE, datetime.min.time(), tzinfo=timezone.utc
            ) + timedelta(hours=9)

            def make_slot(prov_id, half_hour_offset, status):
                start = base + timedelta(minutes=30 * half_hour_offset)
                return AppointmentSlot(
                    provider_id=prov_id,
                    start_time=start,
                    end_time=start + timedelta(minutes=30),
                    status=status,
                )

            available_slot = make_slot(provider.id, 0, SlotStatus.available)
            booked_slot = make_slot(provider.id, 1, SlotStatus.booked)
            blocked_slot = make_slot(provider.id, 2, SlotStatus.blocked)
            # Same day, different doctor — should be excluded.
            other_slot = make_slot(other_provider.id, 0, SlotStatus.available)
            db.add_all([available_slot, booked_slot, blocked_slot, other_slot])
            db.flush()

            appointment = Appointment(
                patient_id=patient.id,
                slot_id=booked_slot.id,
                service_id=service.id,
                status=AppointmentStatus.confirmed,
            )
            db.add(appointment)
            db.commit()

            self.doctor_user = doctor_user
            self.expected_patient_name = "Pat Patient"
            self.expected_service_name = service.name

            self.created_user_ids = [doctor_user.id, other_user.id, patient_user.id]
            self.created_provider_ids = [provider.id, other_provider.id]
            self.created_patient_ids = [patient.id]
            self.created_service_ids = [service.id]
            self.created_slot_ids = [
                available_slot.id,
                booked_slot.id,
                blocked_slot.id,
                other_slot.id,
            ]
            self.created_appointment_ids = [appointment.id]
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def tearDown(self):
        db = SessionLocal()
        try:
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

    def test_returns_all_three_statuses_for_logged_in_doctor(self):
        db = SessionLocal()
        try:
            result = get_schedule(date=SCHEDULE_DATE, db=db, current_user=self.doctor_user)
        finally:
            db.close()

        # Exactly this doctor's three slots — the other doctor's slot is excluded.
        self.assertEqual(len(result), 3, result)
        statuses = {row.status for row in result}
        self.assertEqual(
            statuses,
            {SlotStatus.available, SlotStatus.booked, SlotStatus.blocked},
        )
        # Ordered by start_time.
        starts = [row.start_time for row in result]
        self.assertEqual(starts, sorted(starts))

    def test_booked_slot_includes_patient_and_service(self):
        db = SessionLocal()
        try:
            result = get_schedule(date=SCHEDULE_DATE, db=db, current_user=self.doctor_user)
        finally:
            db.close()
        by_status = {row.status: row for row in result}

        booked = by_status[SlotStatus.booked]
        self.assertEqual(booked.patient_name, self.expected_patient_name)
        self.assertEqual(booked.service_name, self.expected_service_name)

        # Non-booked slots carry no patient/service info.
        self.assertIsNone(by_status[SlotStatus.available].patient_name)
        self.assertIsNone(by_status[SlotStatus.available].service_name)
        self.assertIsNone(by_status[SlotStatus.blocked].patient_name)

    def test_empty_when_no_slots_on_date(self):
        db = SessionLocal()
        try:
            result = get_schedule(
                date=SCHEDULE_DATE + timedelta(days=1),
                db=db,
                current_user=self.doctor_user,
            )
        finally:
            db.close()
        self.assertEqual(result, [])

    def test_invalid_date_returns_422(self):
        try:
            from fastapi.testclient import TestClient
            from app.core.security import create_access_token
            from app.main import app
        except Exception as exc:  # httpx not installed in this environment
            raise unittest.SkipTest(f"HTTP layer unavailable: {exc}")

        client = TestClient(app)
        token = create_access_token(
            data={"sub": str(self.doctor_user.id), "role": "doctor"}
        )
        resp = client.get(
            "/doctor/schedule",
            params={"date": "17-05-2030"},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(resp.status_code, 422, resp.text)


if __name__ == "__main__":
    unittest.main()

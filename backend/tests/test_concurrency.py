import sys
import threading
import unittest
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Union
from uuid import UUID, uuid4

from fastapi import HTTPException, status

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal, engine
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.provider import Provider
from app.models.service import Service
from app.models.slot import AppointmentSlot, SlotStatus
from app.models.user import User
from app.routes.appointments import BookingRequest, book_appointment


CONCURRENT_BOOKERS = 10


@dataclass(frozen=True)
class BookingSeed:
    slot_id: UUID
    service_id: int
    provider_id: int
    provider_user_id: int
    patient_ids: list[UUID]
    patient_user_ids: list[int]


def _create_booking_seed() -> BookingSeed:
    marker = uuid4().hex
    db = SessionLocal()

    try:
        provider_user = User(
            email=f"concurrency-provider-{marker}@example.test",
            password_hash="test",
            role="doctor",
            full_name="Concurrency Provider",
        )
        service = Service(
            name=f"Concurrency Test Service {marker}",
            duration_minutes=30,
            department="Tests",
        )
        db.add_all([provider_user, service])
        db.flush()

        provider = Provider(
            user_id=provider_user.id,
            specialty="Concurrency",
            working_hours={},
        )
        db.add(provider)
        db.flush()

        start_time = datetime.now(timezone.utc) + timedelta(days=30)
        slot = AppointmentSlot(
            provider_id=provider.id,
            start_time=start_time,
            end_time=start_time + timedelta(minutes=30),
            status=SlotStatus.available,
        )
        db.add(slot)

        patient_ids = []
        patient_user_ids = []
        for index in range(CONCURRENT_BOOKERS):
            patient_user = User(
                email=f"concurrency-patient-{marker}-{index}@example.test",
                password_hash="test",
                role="patient",
                full_name=f"Concurrency Patient {index}",
            )
            db.add(patient_user)
            db.flush()

            patient = Patient(
                user_id=patient_user.id,
                full_name=patient_user.full_name,
                dob=date(2000, 1, 1),
                phone="0000000000",
                address="test",
            )
            db.add(patient)
            db.flush()

            patient_ids.append(patient.id)
            patient_user_ids.append(patient_user.id)

        db.commit()

        return BookingSeed(
            slot_id=slot.id,
            service_id=service.id,
            provider_id=provider.id,
            provider_user_id=provider_user.id,
            patient_ids=patient_ids,
            patient_user_ids=patient_user_ids,
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _delete_booking_seed(seed: BookingSeed) -> None:
    db = SessionLocal()
    try:
        db.query(Appointment).filter(Appointment.slot_id == seed.slot_id).delete(
            synchronize_session=False
        )
        db.query(AppointmentSlot).filter(AppointmentSlot.id == seed.slot_id).delete(
            synchronize_session=False
        )
        db.query(Provider).filter(Provider.id == seed.provider_id).delete(
            synchronize_session=False
        )
        db.query(Patient).filter(Patient.id.in_(seed.patient_ids)).delete(
            synchronize_session=False
        )
        db.query(User).filter(
            User.id.in_(seed.patient_user_ids + [seed.provider_user_id])
        ).delete(synchronize_session=False)
        db.query(Service).filter(Service.id == seed.service_id).delete(
            synchronize_session=False
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _book_same_slot_at_once(
    barrier: threading.Barrier,
    slot_id: UUID,
    patient_id: UUID,
    service_id: int,
) -> Union[int, str]:
    db = SessionLocal()
    try:
        barrier.wait(timeout=10)
        book_appointment(
            BookingRequest(
                slot_id=slot_id,
                patient_id=patient_id,
                service_id=service_id,
            ),
            db=db,
        )
        return status.HTTP_201_CREATED
    except HTTPException as exc:
        db.rollback()
        return exc.status_code
    except Exception as exc:
        db.rollback()
        return f"{type(exc).__name__}: {exc}"
    finally:
        db.close()


class ConcurrencyBookingTest(unittest.TestCase):
    def test_atomic_booking_prevents_double_booking_under_parallel_load(self):
        if engine.dialect.name != "postgresql":
            raise unittest.SkipTest("SELECT ... FOR UPDATE row locks require PostgreSQL")

        seed = _create_booking_seed()
        try:
            barrier = threading.Barrier(CONCURRENT_BOOKERS)

            with ThreadPoolExecutor(max_workers=CONCURRENT_BOOKERS) as executor:
                results = list(
                    executor.map(
                        lambda patient_id: _book_same_slot_at_once(
                            barrier,
                            seed.slot_id,
                            patient_id,
                            seed.service_id,
                        ),
                        seed.patient_ids,
                    )
                )

            result_counts = Counter(results)

            self.assertEqual(result_counts[status.HTTP_201_CREATED], 1, results)
            self.assertEqual(result_counts[status.HTTP_409_CONFLICT], 9, results)
            self.assertTrue(
                set(results) <= {status.HTTP_201_CREATED, status.HTTP_409_CONFLICT},
                results,
            )

            db = SessionLocal()
            try:
                appointment_count = (
                    db.query(Appointment)
                    .filter(Appointment.slot_id == seed.slot_id)
                    .count()
                )
                slot = (
                    db.query(AppointmentSlot)
                    .filter(AppointmentSlot.id == seed.slot_id)
                    .one()
                )

                self.assertEqual(appointment_count, 1)
                self.assertEqual(slot.status, SlotStatus.booked)
            finally:
                db.close()
        finally:
            _delete_booking_seed(seed)


if __name__ == "__main__":
    unittest.main()

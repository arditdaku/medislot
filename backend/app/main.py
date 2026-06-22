from datetime import datetime, timezone

from app.routes import auth
from app.routes import slots
from app.routes import appointments
from app.routes import services
from app.routes import providers
from app.routes import dashboard
from app.routes import patients
from app.routes import doctor
from app.routes import admin
from app.routes import visit_records
from app.routes import prescriptions


from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import get_db

app = FastAPI(
    title="MediSlot API",
    description="API for managing clinic appointments and capacities",
    version="1.0.0"
)
# CORS -- change * with values  in production!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(slots.router)
app.include_router(appointments.router)
app.include_router(providers.router)
app.include_router(services.router)
app.include_router(dashboard.router)
app.include_router(patients.router)
app.include_router(doctor.router)
app.include_router(admin.router)
app.include_router(visit_records.router)
app.include_router(prescriptions.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to MediSlot API!"}


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Liveness check including a database connectivity ping."""
    timestamp = datetime.now(timezone.utc).isoformat()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected", "timestamp": timestamp}
    except Exception as exc:
        return {
            "status": "degraded",
            "database": "unreachable",
            "detail": str(exc),
            "timestamp": timestamp,
        }

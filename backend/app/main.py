from datetime import datetime, timezone
from app.routes import auth
from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

app = FastAPI(
    title="MediSlot API",
    description="API for managing clinic appointments and capacities",
    version="1.0.0"
)

app.include_router(auth.router)

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

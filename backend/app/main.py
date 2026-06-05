from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

app = FastAPI(
    title="MediSlot API",
    description="API for managing clinic appointments and capacities",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "Welcome to MediSlot API!"}


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Liveness check including a database connectivity ping."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        return {"status": "degraded", "database": "unreachable", "detail": str(exc)}

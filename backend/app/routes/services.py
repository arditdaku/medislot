from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.service import Service
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceResponse])
def list_services(db: Session = Depends(get_db)):
    return db.query(Service).order_by(Service.name).all()


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(["admin"])),
):
    """Admin-only: create a new service. Returns 409 if the name already exists."""
    service = Service(
        name=payload.name,
        duration_minutes=payload.duration_minutes,
        department=payload.department,
    )
    try:
        db.add(service)
        db.commit()
        db.refresh(service)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A service with this name already exists",
        )
    return service


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(["admin"])),
):
    """Admin-only: update an existing service. Only provided fields are changed."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)

    try:
        db.commit()
        db.refresh(service)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A service with this name already exists",
        )
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(["admin"])),
):
    """Admin-only: delete a service. Returns 409 if it is still referenced by
    appointments (foreign-key constraint)."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    try:
        db.delete(service)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a service that is referenced by appointments",
        )
    return None

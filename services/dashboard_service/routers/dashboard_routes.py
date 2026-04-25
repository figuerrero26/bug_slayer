from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.profile_model import Profile, UserStats
from schemas.profile_schema import ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/{user_id}", response_model=ProfileResponse)
def get_dashboard(user_id: int, db: Session = Depends(get_db)):
    """Devuelve el perfil completo + estadísticas del usuario."""
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()

    return ProfileResponse(
        user_id=profile.user_id,
        full_name=profile.full_name,
        birth_date=profile.birth_date,
        country_city=profile.country_city,
        phone=profile.phone,
        photo_url=profile.photo_url,
        completed_events=stats.completed_events if stats else 0,
        pending_events=stats.pending_events if stats else 0,
        unread_messages=stats.unread_messages if stats else 0,
    )


@router.patch("/{user_id}", response_model=ProfileResponse)
def update_dashboard(user_id: int, payload: ProfileUpdate, db: Session = Depends(get_db)):
    """Actualiza los datos del perfil del usuario."""
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    return ProfileResponse(
        user_id=profile.user_id,
        full_name=profile.full_name,
        birth_date=profile.birth_date,
        country_city=profile.country_city,
        phone=profile.phone,
        photo_url=profile.photo_url,
        completed_events=stats.completed_events if stats else 0,
        pending_events=stats.pending_events if stats else 0,
        unread_messages=stats.unread_messages if stats else 0,
    )

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.profile_model import Profile, UserStats
from schemas.profile_schema import CreateProfileInternal

router = APIRouter(prefix="/internal", tags=["internal"])


@router.post("/create-profile", status_code=201)
def create_profile(payload: CreateProfileInternal, db: Session = Depends(get_db)):
    """
    Endpoint interno — solo debe ser llamado por auth_service al momento del registro.
    Crea el perfil y los contadores de estadísticas en cero.
    """
    if db.query(Profile).filter(Profile.user_id == payload.user_id).first():
        raise HTTPException(status_code=400, detail="El perfil ya existe")

    profile = Profile(
        user_id=payload.user_id,
        full_name=payload.full_name,
        phone=payload.phone,
        country_city=payload.country_city,
    )
    stats = UserStats(
        user_id=payload.user_id,
        completed_events=0,
        pending_events=0,
        unread_messages=0,
    )

    db.add(profile)
    db.add(stats)
    db.commit()

    return {"message": "Perfil creado correctamente", "user_id": payload.user_id}

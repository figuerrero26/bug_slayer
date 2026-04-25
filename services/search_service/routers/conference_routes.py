from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
from models.conference_model import Conference
from schemas.conference_schema import ConferenceResponse

router = APIRouter(prefix="/conferences", tags=["conferences"])


@router.get("/", response_model=List[ConferenceResponse])
def list_conferences(
    category: Optional[str] = Query(None, description="Filtra por categoría"),
    speaker: Optional[str] = Query(None, description="Filtra por nombre del ponente"),
    db: Session = Depends(get_db),
):
    """Lista conferencias. No requiere autenticación."""
    query = db.query(Conference)
    if category:
        query = query.filter(Conference.category.ilike(f"%{category}%"))
    if speaker:
        query = query.filter(Conference.speaker_name.ilike(f"%{speaker}%"))
    return query.all()


@router.get("/{conference_id}", response_model=ConferenceResponse)
def get_conference(conference_id: int, db: Session = Depends(get_db)):
    conf = db.query(Conference).filter(Conference.id == conference_id).first()
    if not conf:
        raise HTTPException(status_code=404, detail="Conferencia no encontrada")
    return conf

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import date

from database import get_db
from models.conference_model import Conference, ConferenceRegistration
from schemas.conference_schema import ConferenceCreate, ConferenceUpdate, ConferenceResponse

router = APIRouter(prefix="/conferences", tags=["conferences"])

UPLOAD_DIR     = Path("uploads/speakers")
ALLOWED_TYPES  = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024   # 5 MB


# ── Helper ────────────────────────────────────────────────────────────────────

def _with_count(db: Session, conf: Conference) -> ConferenceResponse:
    count = (
        db.query(func.count(ConferenceRegistration.id))
        .filter(
            ConferenceRegistration.conference_id == conf.id,
            ConferenceRegistration.status == "activo",
        )
        .scalar()
    ) or 0
    out = ConferenceResponse.model_validate(conf)
    out.registered_count = count
    return out


# ── CRUD conferencias ─────────────────────────────────────────────────────────

@router.get("", response_model=List[ConferenceResponse])
def list_conferences(
    category: Optional[str] = Query(None),
    speaker:  Optional[str] = Query(None),
    day:      Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Conference).filter(Conference.is_active == True)
    if category:
        q = q.filter(Conference.category.ilike(f"%{category}%"))
    if speaker:
        q = q.filter(Conference.speaker_name.ilike(f"%{speaker}%"))
    if day:
        q = q.filter(func.date(Conference.schedule) == day)
    return [_with_count(db, c) for c in q.order_by(Conference.schedule).all()]


@router.get("/{conference_id}", response_model=ConferenceResponse)
def get_conference(conference_id: int, db: Session = Depends(get_db)):
    conf = db.query(Conference).filter(
        Conference.id == conference_id,
        Conference.is_active == True,
    ).first()
    if not conf:
        raise HTTPException(status_code=404, detail="Conferencia no encontrada")
    return _with_count(db, conf)


@router.post("", response_model=ConferenceResponse, status_code=201)
def create_conference(payload: ConferenceCreate, db: Session = Depends(get_db)):
    conf = Conference(**payload.model_dump())
    db.add(conf)
    db.commit()
    db.refresh(conf)
    return _with_count(db, conf)


@router.put("/{conference_id}", response_model=ConferenceResponse)
def update_conference(
    conference_id: int,
    payload: ConferenceUpdate,
    db: Session = Depends(get_db),
):
    conf = db.query(Conference).filter(
        Conference.id == conference_id,
        Conference.is_active == True,
    ).first()
    if not conf:
        raise HTTPException(status_code=404, detail="Conferencia no encontrada")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(conf, field, value)
    db.commit()
    db.refresh(conf)
    return _with_count(db, conf)


@router.delete("/{conference_id}", status_code=204)
def delete_conference(conference_id: int, db: Session = Depends(get_db)):
    conf = db.query(Conference).filter(
        Conference.id == conference_id,
        Conference.is_active == True,
    ).first()
    if not conf:
        raise HTTPException(status_code=404, detail="Conferencia no encontrada")
    conf.is_active = False
    db.commit()


# ── Upload imagen del ponente ─────────────────────────────────────────────────

@router.post("/{conference_id}/speaker-image", response_model=ConferenceResponse)
async def upload_speaker_image(
    conference_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Carga la imagen del ponente y guarda la ruta en la base de datos.
    La imagen se sirve como archivo estático desde /static/speakers/.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Formato no permitido. Solo JPEG, PNG o WebP.",
        )

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB.")

    conf = db.query(Conference).filter(
        Conference.id == conference_id,
        Conference.is_active == True,
    ).first()
    if not conf:
        raise HTTPException(status_code=404, detail="Conferencia no encontrada")

    # Eliminar imagen anterior si existe
    if conf.speaker_image_url:
        old_file = UPLOAD_DIR / conf.speaker_image_url.rsplit("/", 1)[-1]
        old_file.unlink(missing_ok=True)

    # Guardar nueva imagen con nombre único
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext      = (file.filename or "img").rsplit(".", 1)[-1].lower()
    ext      = ext if ext in ("jpg", "jpeg", "png", "webp") else "jpg"
    filename = f"speaker_{conference_id}_{uuid.uuid4().hex[:10]}.{ext}"
    (UPLOAD_DIR / filename).write_bytes(content)

    # Guardar ruta relativa en DB (el frontend construye la URL completa)
    conf.speaker_image_url = f"/static/speakers/{filename}"
    db.commit()
    db.refresh(conf)

    return _with_count(db, conf)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.qr import QRValidationRequest, QRValidationResponse
from utils.qr_utils import parse_qr_string, verify_qr_signature
from models.conference_model import ConferenceRegistration, Conference

router = APIRouter(prefix="/qr", tags=["QR"])


@router.post("/validate", response_model=QRValidationResponse)
def validate_qr(body: QRValidationRequest, db: Session = Depends(get_db)):
    parsed = parse_qr_string(body.qr_payload)
    if not parsed:
        return QRValidationResponse(valid=False, message="Formato de QR inválido")

    if not verify_qr_signature(parsed["payload_body"], parsed["sig"]):
        return QRValidationResponse(valid=False, message="Firma inválida — QR no auténtico")

    reg = db.query(ConferenceRegistration).filter_by(
        id=parsed["registration_id"],
        user_id=parsed["user_id"],
        conference_id=parsed["conference_id"],
        status="activo",
    ).first()

    if not reg:
        return QRValidationResponse(valid=False, message="Inscripción no encontrada o inactiva")

    conf = db.query(Conference).filter_by(id=parsed["conference_id"]).first()

    return QRValidationResponse(
        valid=True,
        message="QR válido",
        registration_id=reg.id,
        user_id=reg.user_id,
        conference_id=reg.conference_id,
        conference_title=conf.title if conf else None,
    )

import asyncio
import functools
import hashlib
import hmac
import io
import os
from datetime import datetime

import httpx
import qrcode
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from database import get_db
from models.conference_model import Conference, ConferenceRegistration
from utils.jwt_utils import get_current_user_id

router = APIRouter(prefix="/certificados", tags=["certificados"])

DASHBOARD_URL   = os.getenv("DASHBOARD_SERVICE_URL", "http://localhost:8002")
CERT_PUBLIC_URL = os.getenv("CERT_PUBLIC_URL",        "https://coniiti.com")
CERT_SECRET     = os.getenv("CERT_SECRET",            "coniiti-cert-secret-2026")

_NAVY  = HexColor("#0D1B3E")
_GOLD  = HexColor("#C9A227")
_WHITE = HexColor("#FFFFFF")

_MONTHS_ES = [
    "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _cert_hmac(registration_id: int, user_id: int, conference_id: int) -> str:
    """Token HMAC-SHA256 de 32 hex chars para el QR de verificación."""
    body = f"{registration_id}:{user_id}:{conference_id}"
    return hmac.new(CERT_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()[:32]


def _fmt_date_es(dt: datetime) -> str:
    return f"{dt.day} de {_MONTHS_ES[dt.month]} de {dt.year}"


def _qr_to_buffer(url: str) -> io.BytesIO:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0D1B3E", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def _draw_pdf(
    full_name: str,
    conf_title: str,
    speaker: str | None,
    schedule: datetime | None,
    qr_url: str,
) -> io.BytesIO:
    """
    Genera el certificado PDF en memoria y retorna el buffer listo para streaming.
    Diseño: landscape letter (792 × 612 pt), fondo blanco, bordes navy/gold,
    banda de cabecera navy, tipografía institucional CONIITI.
    """
    W, H = landscape(letter)   # 792 × 612
    CX = W / 2                 # 396 — centro horizontal

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=landscape(letter))

    # ── Fondo blanco ──────────────────────────────────────────────────────────
    c.setFillColor(_WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── Borde exterior navy (4 pt) ────────────────────────────────────────────
    c.setStrokeColor(_NAVY)
    c.setLineWidth(4)
    c.rect(12, 12, W - 24, H - 24, fill=0, stroke=1)

    # ── Borde interior gold decorativo (1.2 pt) ───────────────────────────────
    c.setStrokeColor(_GOLD)
    c.setLineWidth(1.2)
    c.rect(20, 20, W - 40, H - 40, fill=0, stroke=1)

    # ── Banda de cabecera navy (y 555–600) ────────────────────────────────────
    c.setFillColor(_NAVY)
    c.rect(12, 555, W - 24, 45, fill=1, stroke=0)

    c.setFillColor(_WHITE)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(35, 573, "CONIITI")
    c.setFont("Helvetica", 8)
    c.drawRightString(W - 35, 580, "Congreso Internacional de Ingeniería y Tecnología")
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(W - 35, 564, "CONIITI · 2026")

    # ── Línea gold bajo cabecera ──────────────────────────────────────────────
    c.setStrokeColor(_GOLD)
    c.setLineWidth(2)
    c.line(20, 552, W - 20, 552)

    # ── Sección título ─────────────────────────────────────────────────────────
    c.setStrokeColor(_GOLD)
    c.setLineWidth(0.8)
    c.line(80, 518, W - 80, 518)

    c.setFillColor(_NAVY)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(CX, 484, "CERTIFICADO DE ASISTENCIA")

    c.setStrokeColor(_GOLD)
    c.setLineWidth(0.8)
    c.line(80, 478, W - 80, 478)

    # ── Cuerpo del certificado ────────────────────────────────────────────────
    c.setFillColor(_NAVY)
    c.setFont("Helvetica", 11)
    c.drawCentredString(CX, 450, "La organización CONIITI otorga el presente certificado a:")

    # Nombre del participante
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(CX, 415, full_name)
    name_w = c.stringWidth(full_name, "Helvetica-Bold", 22)
    c.setStrokeColor(_GOLD)
    c.setLineWidth(1.5)
    c.line(CX - name_w / 2, 410, CX + name_w / 2, 410)

    c.setFillColor(_NAVY)
    c.setFont("Helvetica", 11)
    c.drawCentredString(CX, 383, "por haber asistido a la conferencia:")

    # Título de la conferencia (con truncado defensivo)
    fn, fs = "Helvetica-BoldOblique", 15
    MAX_W = W - 160
    display = conf_title
    while c.stringWidth(f'"{display}"', fn, fs) > MAX_W and len(display) > 10:
        display = display[:-1]
    if display != conf_title:
        display += "..."
    c.setFont(fn, fs)
    c.drawCentredString(CX, 360, f'"{display}"')

    # Ponente y fecha
    parts = []
    if speaker:
        parts.append(f"Dictada por: {speaker}")
    if schedule:
        parts.append(f"Fecha: {_fmt_date_es(schedule)}")
    c.setFont("Helvetica", 10)
    c.drawCentredString(CX, 332, "   ·   ".join(parts))

    # ── Área de firmas ────────────────────────────────────────────────────────
    c.setStrokeColor(_GOLD)
    c.setLineWidth(0.8)
    c.line(50, 272, W - 50, 272)

    for sig_cx, name, role1, role2 in [
        (145, "Dr. Juan Carlos Hernández", "Director Académico",  "CONIITI 2026"),
        (375, "Ing. María González Torres", "Coordinadora General", "CONIITI 2026"),
    ]:
        c.setStrokeColor(_NAVY)
        c.setLineWidth(0.8)
        c.line(sig_cx - 78, 245, sig_cx + 78, 245)
        c.setFillColor(_NAVY)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(sig_cx, 233, name)
        c.setFont("Helvetica", 8)
        c.drawCentredString(sig_cx, 221, role1)
        c.drawCentredString(sig_cx, 210, role2)

    # ── Código QR ─────────────────────────────────────────────────────────────
    qr_reader = ImageReader(_qr_to_buffer(qr_url))
    QR_SIZE = 108
    QR_X    = W - 55 - QR_SIZE   # ≈ 629, alineado al borde derecho interior
    QR_Y    = 148
    c.drawImage(qr_reader, QR_X, QR_Y, width=QR_SIZE, height=QR_SIZE, preserveAspectRatio=True)
    c.setFillColor(_NAVY)
    c.setFont("Helvetica", 7)
    c.drawCentredString(QR_X + QR_SIZE / 2, QR_Y - 11, "Verificar autenticidad")

    # ── Pie de página ─────────────────────────────────────────────────────────
    c.setFillColor(_NAVY)
    c.setFont("Helvetica", 7)
    c.drawCentredString(
        CX, 34,
        "Documento generado automáticamente por el sistema CONIITI 2026  ·  "
        "Escanee el código QR para verificar la autenticidad de este certificado.",
    )

    c.save()
    buf.seek(0)
    return buf


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/descargar/{id_inscripcion}")
async def download_certificate(
    id_inscripcion: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Genera y descarga el certificado PDF de asistencia.
    - id_inscripcion: registration_id (campo id_inscripcion del frontend).
    - user_id:        extraído del JWT Bearer — imposible de falsificar.
    - Requisito:      asistio = True en la inscripción.
    """
    # 1. Verificar que la inscripción pertenece al usuario y tiene asistencia validada
    reg = db.query(ConferenceRegistration).filter_by(
        id=id_inscripcion,
        user_id=user_id,
        status="activo",
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    if not reg.asistio:
        raise HTTPException(
            status_code=403,
            detail="Certificado no disponible: la asistencia a esta conferencia no fue validada",
        )

    # 2. Datos de la conferencia
    conf = db.query(Conference).filter_by(id=reg.conference_id, is_active=True).first()
    if not conf:
        raise HTTPException(status_code=404, detail="Conferencia no encontrada")

    # 3. Nombre completo desde dashboard_service (fallback silencioso)
    full_name = "Participante CONIITI"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{DASHBOARD_URL}/profile/{user_id}")
            if resp.status_code == 200:
                full_name = resp.json().get("full_name", full_name)
    except httpx.RequestError:
        pass

    # 4. URL de verificación con token HMAC
    token  = _cert_hmac(reg.id, user_id, conf.id)
    qr_url = f"{CERT_PUBLIC_URL}/validar-certificado/{reg.id}?token={token}"

    # 5. Generar PDF en un thread pool para no bloquear el event loop
    loop    = asyncio.get_running_loop()
    pdf_buf = await loop.run_in_executor(
        None,
        functools.partial(
            _draw_pdf,
            full_name=full_name,
            conf_title=conf.title,
            speaker=conf.speaker_name,
            schedule=conf.schedule,
            qr_url=qr_url,
        ),
    )

    safe     = "".join(ch for ch in conf.title if ch.isalnum() or ch in " _-")[:40].strip().replace(" ", "_")
    filename = f"certificado_{safe or 'CONIITI'}.pdf"

    return StreamingResponse(
        pdf_buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

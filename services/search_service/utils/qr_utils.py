import hmac
import hashlib
import os

QR_SECRET = os.getenv("QR_SECRET", "coniiti-2026-dev-secret")


def build_qr_payload(registration_id: int, user_id: int, conference_id: int) -> str:
    """
    Genera el string firmado que se codificará como QR.
    Formato: CONIITI|REG:X|USR:Y|CONF:Z|SIG:AAAA...
    El secret nunca abandona el servidor.
    """
    body = f"REG:{registration_id}|USR:{user_id}|CONF:{conference_id}"
    sig = hmac.new(
        QR_SECRET.encode(),
        body.encode(),
        hashlib.sha256,
    ).hexdigest()[:16].upper()
    return f"CONIITI|{body}|SIG:{sig}"


def verify_qr_signature(payload_body: str, received_sig: str) -> bool:
    expected = hmac.new(
        QR_SECRET.encode(),
        payload_body.encode(),
        hashlib.sha256,
    ).hexdigest()[:16].upper()
    return hmac.compare_digest(expected, received_sig.upper())


def parse_qr_string(qr_string: str) -> dict | None:
    """
    Parsea: CONIITI|REG:X|USR:Y|CONF:Z|SIG:AAAA
    Retorna None si el formato es inválido.
    """
    try:
        parts = qr_string.split("|")
        if len(parts) != 5 or parts[0] != "CONIITI":
            return None
        return {
            "registration_id": int(parts[1].split(":")[1]),
            "user_id":         int(parts[2].split(":")[1]),
            "conference_id":   int(parts[3].split(":")[1]),
            "sig":             parts[4].split(":")[1],
            "payload_body":    "|".join(parts[1:4]),
        }
    except (IndexError, ValueError):
        return None

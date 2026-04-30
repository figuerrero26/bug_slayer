import smtplib
import os
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")


def send_email(subject: str, body: str, to: str = "") -> None:
    """
    Envía un correo transaccional. Si las credenciales SMTP no están configuradas
    o el envío falla, registra el error sin interrumpir el flujo principal.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[email] SMTP no configurado, se omite el envío.")
        return

    recipient = to or SMTP_USER  # Si no hay destinatario, se envía al propio remitente (útil en dev)

    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = f"[CONIITI 2026] {subject}"
        msg["From"] = SMTP_USER
        msg["To"] = recipient

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, recipient, msg.as_string())

        print(f"[email] Correo enviado a {recipient}: {subject}")
    except Exception as e:
        print(f"[email] Error al enviar correo: {e}")

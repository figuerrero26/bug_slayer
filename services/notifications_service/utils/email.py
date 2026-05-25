import smtplib
import ssl
import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("notifications.email")

# Aliases: acepta tanto SMTP_HOST como SMTP_SERVER, SMTP_USERNAME como SMTP_USER
SMTP_HOST     = os.getenv("SMTP_HOST") or os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM     = os.getenv("SMTP_FROM") or SMTP_USERNAME


def send_email(subject: str, body_html: str, to: str, body_plain: str = "") -> bool:
    """
    Envía un correo HTML transaccional vía STARTTLS.
    Retorna True si el envío fue exitoso, False en caso contrario.
    Nunca lanza excepciones — los errores se imprimen en consola y se registran en el logger.
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("[email] ⚠  Credenciales SMTP no configuradas (SMTP_USERNAME/SMTP_PASSWORD vacíos) — se omite el envío.")
        logger.warning("Credenciales SMTP no configuradas — envío omitido.")
        return False

    if not to or not to.strip():
        print("[email] ⚠  Destinatario vacío — se omite el envío.")
        logger.warning("Destinatario vacío — envío omitido.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[CONIITI 2026] {subject}"
    msg["From"]    = SMTP_FROM
    msg["To"]      = to

    if body_plain:
        msg.attach(MIMEText(body_plain, "plain", "utf-8"))
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    # Puerto 465 → SSL directo; cualquier otro (587, 2525…) → STARTTLS
    use_ssl = (SMTP_PORT == 465)
    print(f"[email] Conectando a {SMTP_HOST}:{SMTP_PORT} ({'SSL' if use_ssl else 'STARTTLS'}) …")
    try:
        if use_ssl:
            ctx = ssl.create_default_context()
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15, context=ctx) as server:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM, to, msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM, to, msg.as_string())

        print(f"[email] ✓ Correo enviado — Para: {to} | Asunto: {subject}")
        logger.info("Correo enviado a %s | %s", to, subject)
        return True

    except smtplib.SMTPAuthenticationError as e:
        # Causas más frecuentes: contraseña incorrecta, App Password de Google no generada,
        # o cuenta sin "Acceso de apps menos seguras" habilitado.
        print(
            f"[email] ✗ ERROR de autenticación SMTP.\n"
            f"         Verifica SMTP_USERNAME='{SMTP_USERNAME}' y SMTP_PASSWORD.\n"
            f"         Si usas Gmail, genera un App Password en: https://myaccount.google.com/apppasswords\n"
            f"         Detalle: {e}"
        )
        logger.error("SMTPAuthenticationError: %s", e)

    except smtplib.SMTPConnectError as e:
        print(
            f"[email] ✗ ERROR de conexión — no se pudo alcanzar {SMTP_HOST}:{SMTP_PORT}.\n"
            f"         Posibles causas: host incorrecto, firewall bloqueando el puerto, o servicio caído.\n"
            f"         Detalle: {e}"
        )
        logger.error("SMTPConnectError a %s:%s — %s", SMTP_HOST, SMTP_PORT, e)

    except smtplib.SMTPRecipientsRefused as e:
        print(
            f"[email] ✗ ERROR — destinatario rechazado por el servidor: {to}.\n"
            f"         Verifica que la dirección de correo sea válida.\n"
            f"         Detalle: {e}"
        )
        logger.error("SMTPRecipientsRefused para %s — %s", to, e)

    except smtplib.SMTPException as e:
        print(f"[email] ✗ ERROR SMTP genérico: {e}")
        logger.error("SMTPException: %s", e)

    except ssl.SSLError as e:
        print(
            f"[email] ✗ ERROR TLS/SSL.\n"
            f"         Verifica que el puerto {SMTP_PORT} soporte STARTTLS (587) y no SSL directo (465).\n"
            f"         Detalle: {e}"
        )
        logger.error("SSLError: %s", e)

    except ConnectionRefusedError:
        print(
            f"[email] ✗ ERROR — conexión rechazada en {SMTP_HOST}:{SMTP_PORT}.\n"
            f"         El puerto puede estar bloqueado por firewall o el servidor no está escuchando."
        )
        logger.error("ConnectionRefusedError a %s:%s", SMTP_HOST, SMTP_PORT)

    except TimeoutError:
        print(
            f"[email] ✗ ERROR — timeout al conectar con {SMTP_HOST}:{SMTP_PORT}.\n"
            f"         Verifica la conectividad de red desde el contenedor/servidor."
        )
        logger.error("TimeoutError a %s:%s", SMTP_HOST, SMTP_PORT)

    except OSError as e:
        print(f"[email] ✗ ERROR de red/OS: {e}")
        logger.error("OSError: %s", e)

    return False

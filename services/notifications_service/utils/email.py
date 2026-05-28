import smtplib
import ssl
import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import make_msgid, formatdate
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("notifications.email")

# ── Configuración ─────────────────────────────────────────────────────────────
SMTP_HOST       = os.getenv("SMTP_HOST") or os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT       = int(os.getenv("SMTP_PORT", "465"))
SMTP_USERNAME   = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER", "")
SMTP_PASSWORD   = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM       = os.getenv("SMTP_FROM") or SMTP_USERNAME

# SMTP_DEBUG=1   → imprime en consola todo el diálogo SMTP (útil para diagnóstico)
# SMTP_VERIFY_SSL=false → desactiva verificación de certificado (solo para servidores
#                         institucionales con cert auto-firmado; NO usar en producción)
SMTP_DEBUG      = os.getenv("SMTP_DEBUG", "0") == "1"
SMTP_VERIFY_SSL = os.getenv("SMTP_VERIFY_SSL", "true").lower() != "false"

# Dominio de envío — se usa en Message-ID y EHLO
_FROM_DOMAIN = SMTP_FROM.split("@")[-1] if "@" in SMTP_FROM else "coniiti2026.co"


def _make_ssl_context() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    if not SMTP_VERIFY_SSL:
        ctx.check_hostname = False
        ctx.verify_mode    = ssl.CERT_NONE
        print(
            "[email] ⚠  SMTP_VERIFY_SSL=false — verificación de certificado deshabilitada.\n"
            "         Usar únicamente para diagnóstico; nunca en producción."
        )
    return ctx


def send_email(subject: str, body_html: str, to: str, body_plain: str = "") -> bool:
    """
    Envía un correo HTML transaccional.
    - Puerto 465 → SSL/TLS directo  (SMTP_SSL)
    - Cualquier otro puerto         → STARTTLS  (587, 2525…)
    Retorna True si el envío fue exitoso.
    Nunca lanza excepciones — todos los errores se registran en consola y logger.
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("[email] ⚠  SMTP_USERNAME / SMTP_PASSWORD no configurados — envío omitido.")
        logger.warning("Credenciales SMTP ausentes — envío omitido.")
        return False

    if not to or not to.strip():
        print("[email] ⚠  Destinatario vacío — envío omitido.")
        logger.warning("Destinatario vacío — envío omitido.")
        return False

    # ── Construcción del mensaje con cabeceras RFC 5322 completas ─────────────
    msg = MIMEMultipart("alternative")
    msg["From"]       = SMTP_FROM
    msg["To"]         = to
    msg["Subject"]    = f"[CONIITI 2026] {subject}"
    msg["Date"]       = formatdate(localtime=False)          # RFC 2822, UTC
    msg["Message-ID"] = make_msgid(domain=_FROM_DOMAIN)      # Único por mensaje
    # MIME-Version: 1.0 es añadido automáticamente por MIMEMultipart

    if body_plain:
        msg.attach(MIMEText(body_plain, "plain", "utf-8"))
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    use_ssl = (SMTP_PORT == 465)
    mode    = "SSL/TLS" if use_ssl else "STARTTLS"
    debug   = "debug=ON" if SMTP_DEBUG else "debug=OFF"
    print(f"[email] Conectando a {SMTP_HOST}:{SMTP_PORT} [{mode}] [{debug}] → {to}")

    try:
        ctx = _make_ssl_context()

        if use_ssl:
            # ── SSL/TLS directo (puerto 465) ──────────────────────────────────
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15, context=ctx) as server:
                server.set_debuglevel(1 if SMTP_DEBUG else 0)
                server.ehlo(_FROM_DOMAIN)
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM, [to], msg.as_bytes())

        else:
            # ── STARTTLS (puerto 587 / 2525) ──────────────────────────────────
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.set_debuglevel(1 if SMTP_DEBUG else 0)
                server.ehlo(_FROM_DOMAIN)
                server.starttls(context=ctx)  # contexto SSL explícito
                server.ehlo(_FROM_DOMAIN)     # segundo EHLO obligatorio post-TLS
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM, [to], msg.as_bytes())

        print(f"[email] ✓ Enviado — Para: {to} | Asunto: {subject}")
        logger.info("Correo enviado a %s | %s", to, subject)
        return True

    # ── Errores específicos con diagnóstico accionable ────────────────────────

    except smtplib.SMTPAuthenticationError as e:
        print(
            f"[email] ✗ ERROR DE AUTENTICACIÓN\n"
            f"         Usuario : {SMTP_USERNAME}\n"
            f"         Causa   : contraseña incorrecta, App Password no generado,\n"
            f"                   o cuenta con verificación en 2 pasos sin App Password.\n"
            f"         Fix     : https://myaccount.google.com/apppasswords\n"
            f"         Código  : {e}"
        )
        logger.error("SMTPAuthenticationError: %s", e)

    except smtplib.SMTPSenderRefused as e:
        print(
            f"[email] ✗ REMITENTE RECHAZADO\n"
            f"         Dirección: {SMTP_FROM}\n"
            f"         Causa    : el servidor no permite enviar desde esta dirección.\n"
            f"                    Con Gmail, SMTP_FROM debe coincidir con SMTP_USERNAME.\n"
            f"         Código   : {e}"
        )
        logger.error("SMTPSenderRefused: %s", e)

    except smtplib.SMTPRecipientsRefused as e:
        refused = e.recipients
        print(
            f"[email] ✗ DESTINATARIO(S) RECHAZADO(S)\n"
            f"         Dirección : {to}\n"
            f"         Respuesta : {refused}\n"
            f"         Posibles causas:\n"
            f"           · El servidor destino (@ucatolica.edu.co) bloquea relay externo.\n"
            f"           · SPF/DMARC del dominio destino rechaza el IP remitente.\n"
            f"           · La cuenta no existe en el servidor institucional.\n"
            f"         Activa SMTP_DEBUG=1 para ver la respuesta exacta del servidor."
        )
        logger.error("SMTPRecipientsRefused para %s: %s", to, refused)

    except smtplib.SMTPConnectError as e:
        print(
            f"[email] ✗ ERROR DE CONEXIÓN a {SMTP_HOST}:{SMTP_PORT}\n"
            f"         Causas   : host incorrecto, firewall bloqueando salida, servicio caído.\n"
            f"         Código   : {e}"
        )
        logger.error("SMTPConnectError a %s:%s — %s", SMTP_HOST, SMTP_PORT, e)

    except smtplib.SMTPException as e:
        print(f"[email] ✗ ERROR SMTP: {e}")
        logger.error("SMTPException: %s", e)

    except ssl.SSLError as e:
        print(
            f"[email] ✗ ERROR TLS/SSL\n"
            f"         Puerto activo : {SMTP_PORT} ({'SSL directo' if use_ssl else 'STARTTLS'})\n"
            f"         Posibles causas:\n"
            f"           · Certificado auto-firmado del servidor institucional → prueba SMTP_VERIFY_SSL=false\n"
            f"           · Puerto 465 con STARTTLS en vez de SSL, o viceversa.\n"
            f"         Detalle : {e}"
        )
        logger.error("SSLError: %s", e)

    except ConnectionRefusedError:
        print(
            f"[email] ✗ CONEXIÓN RECHAZADA en {SMTP_HOST}:{SMTP_PORT}\n"
            f"         El firewall del contenedor o del proveedor bloquea el puerto de salida."
        )
        logger.error("ConnectionRefusedError a %s:%s", SMTP_HOST, SMTP_PORT)

    except TimeoutError:
        print(
            f"[email] ✗ TIMEOUT conectando a {SMTP_HOST}:{SMTP_PORT}\n"
            f"         Verifica la conectividad de red desde el contenedor."
        )
        logger.error("TimeoutError a %s:%s", SMTP_HOST, SMTP_PORT)

    except OSError as e:
        print(f"[email] ✗ ERROR de red/OS: {e}")
        logger.error("OSError: %s", e)

    return False

"""
email_templates.py
Plantillas HTML transaccionales de CONIITI 2026.
Diseño: tarjeta oscura, banner azul, tag de color, caja destacada y footer gris.
Todos los valores dinámicos se escapan con html.escape() para prevenir inyección.
"""
import html as _html


# ── Estructura base ───────────────────────────────────────────────────────────

def _card(tag_bg: str, tag_text: str, title: str, body_rows: str) -> str:
    """Genera el wrapper completo de la tarjeta. body_rows son filas <tr> internas."""
    safe_title = _html.escape(title)
    safe_tag   = _html.escape(tag_text)
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background-color:#0d1526;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:#0d1526;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <!-- ── Tarjeta principal ── -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:580px;background-color:#172038;border-radius:14px;
                    border:1px solid #253552;overflow:hidden;">

        <!-- Banner superior -->
        <tr>
          <td style="background-color:#0f2a6e;padding:28px 32px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;
                      letter-spacing:1.2px;text-transform:uppercase;">CONIITI 2026</p>
            <p style="margin:7px 0 0;color:#bdd5f0;font-size:13px;font-weight:400;">
              Universidad Cat&#xf3;lica de Colombia</p>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:30px 32px 28px;">

            <!-- Tag de tipo -->
            <p style="margin:0 0 18px;display:inline-block;
                      background-color:{tag_bg};color:#ffffff;
                      font-size:11px;font-weight:700;letter-spacing:1.2px;
                      text-transform:uppercase;padding:5px 14px;border-radius:999px;">
              {safe_tag}
            </p>

            <!-- T&#xed;tulo -->
            <h1 style="margin:0 0 14px;color:#dce8f8;font-size:22px;
                       font-weight:700;line-height:1.35;">
              {safe_title}
            </h1>

            {body_rows}

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 32px;background-color:#0f1c2e;
                     border-top:1px solid #253552;text-align:center;">
            <p style="margin:0;color:#4a6080;font-size:12px;line-height:1.6;">
              Este es un correo autom&#xe1;tico. Por favor, no respondas a este mensaje.
            </p>
            <p style="margin:6px 0 0;color:#3a5070;font-size:11px;">
              CONIITI 2026 &middot; Congreso Nacional e Internacional de Innovaci&#xf3;n,
              Tecnolog&#xed;a e Investigaci&#xf3;n
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>"""


# ── Variante: Inscripción confirmada ─────────────────────────────────────────

def html_confirmada(message: str) -> str:
    safe_msg = _html.escape(message)
    body = f"""
    <p style="margin:0 0 22px;color:#aec4e4;font-size:15px;line-height:1.65;">
      {safe_msg}
    </p>

    <!-- Caja destacada verde -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#0d2a1a;border-radius:10px;border:1px solid #16a34a40;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0;color:#86efac;font-size:14px;line-height:1.6;">
            Tu cupo ha sido reservado para participar en <strong>CONIITI 2026</strong>.
            Conserva este mensaje como confirmaci&#xf3;n de tu inscripci&#xf3;n.
          </p>
        </td>
      </tr>
    </table>"""

    return _card(
        tag_bg="#16a34a",
        tag_text="INSCRIPCIÓN CONFIRMADA",
        title="Tu inscripción fue registrada exitosamente",
        body_rows=body,
    )


# ── Variante: Inscripción cancelada ──────────────────────────────────────────

def html_cancelada(message: str) -> str:
    safe_msg = _html.escape(message)
    body = f"""
    <p style="margin:0 0 22px;color:#aec4e4;font-size:15px;line-height:1.65;">
      {safe_msg}
    </p>

    <!-- Caja destacada roja -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#2a0d0d;border-radius:10px;border:1px solid #dc262640;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0;color:#fca5a5;font-size:14px;line-height:1.6;">
            Tu cupo ha sido liberado. Puedes volver a inscribirte en esta u otras
            conferencias disponibles en <strong>CONIITI 2026</strong>.
          </p>
        </td>
      </tr>
    </table>"""

    return _card(
        tag_bg="#dc2626",
        tag_text="INSCRIPCIÓN CANCELADA",
        title="Tu inscripción ha sido cancelada",
        body_rows=body,
    )


# ── Variante: Código OTP / Seguridad ─────────────────────────────────────────

def html_otp(code: str) -> str:
    safe_code = _html.escape(code.strip())
    body = f"""
    <p style="margin:0 0 22px;color:#aec4e4;font-size:15px;line-height:1.65;">
      Usa el siguiente c&#xf3;digo para completar la recuperaci&#xf3;n de tu contrase&#xf1;a.
      No lo compartas con nadie.
    </p>

    <!-- Caja grande del código -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#0a1e3a;border-radius:12px;border:1px solid #1e4a8a;
                  margin-bottom:20px;">
      <tr>
        <td style="padding:30px;text-align:center;">
          <span style="font-size:44px;font-weight:700;letter-spacing:16px;
                       color:#60a5fa;font-family:Courier New,Courier,monospace;">
            {safe_code}
          </span>
        </td>
      </tr>
    </table>

    <!-- Advertencia de expiración -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#1a150a;border-radius:8px;border:1px solid #d9770640;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0;color:#fbbf24;font-size:13px;line-height:1.6;">
            &#x23F1; Este c&#xf3;digo expira en <strong>5 minutos</strong>.
            Si no solicitaste este cambio, ignora este correo.
          </p>
        </td>
      </tr>
    </table>"""

    return _card(
        tag_bg="#d97706",
        tag_text="CÓDIGO DE SEGURIDAD",
        title="Tu código de verificación",
        body_rows=body,
    )


# ── Variante: Notificación genérica (bienvenida, sistema, etc.) ───────────────

def html_generica(title: str, message: str) -> str:
    safe_msg = _html.escape(message)
    body = f"""
    <p style="margin:0 0 22px;color:#aec4e4;font-size:15px;line-height:1.65;">
      {safe_msg}
    </p>

    <!-- Caja informativa azul -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#0a1e35;border-radius:10px;border:1px solid #1e4a7a;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;color:#7ec8f8;font-size:14px;line-height:1.6;">
            Si tienes alguna pregunta, comun&#xed;cate con el equipo de <strong>CONIITI 2026</strong>.
          </p>
        </td>
      </tr>
    </table>"""

    return _card(
        tag_bg="#1e6fbd",
        tag_text="NOTIFICACIÓN",
        title=title,
        body_rows=body,
    )

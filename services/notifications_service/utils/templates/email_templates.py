def html_confirmada(message: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#F5F7FA;font-family:Arial,Helvetica,sans-serif;color:#1F2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F5F7FA;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
            
            <tr>
              <td style="background-color:#0B2D5C;padding:24px 32px;">
                <p style="margin:0;color:#FFFFFF;font-size:20px;font-weight:bold;letter-spacing:0.3px;">
                  CONIITI 2026
                </p>
                <p style="margin:6px 0 0 0;color:#DDEBFF;font-size:13px;">
                  Universidad Católica de Colombia
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px 0;color:#16A34A;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.8px;">
                  Inscripción confirmada
                </p>

                <h1 style="margin:0 0 16px 0;color:#0B2D5C;font-size:26px;line-height:1.25;font-weight:bold;">
                  Tu inscripción fue registrada exitosamente
                </h1>

                <p style="margin:0 0 18px 0;color:#374151;font-size:16px;line-height:1.6;">
                  {message}
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#EFF6FF;border-left:4px solid #1E6CF0;border-radius:8px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0;color:#1F2937;font-size:14px;line-height:1.5;">
                        Tu cupo ha sido reservado para participar en <strong>CONIITI 2026</strong>.
                        Conserva este mensaje como confirmación de tu inscripción.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px;background-color:#F9FAFB;border-top:1px solid #E5E7EB;">
                <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.5;">
                  Este es un correo automático. Por favor, no respondas a este mensaje.
                </p>
                <p style="margin:8px 0 0 0;color:#9CA3AF;font-size:12px;line-height:1.5;">
                  CONIITI 2026 · Congreso Nacional e Internacional de Innovación, Tecnología e Investigación
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def html_cancelada(message: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
  <div style="background:#fff;border-radius:8px;padding:30px;border-top:4px solid #DC2626;">
    <h2 style="color:#0B2D5C;margin-top:0;">Inscripción cancelada</h2>
    <p style="color:#333;font-size:16px;">{message}</p>
    <p style="color:#666;font-size:14px;">
      Tu cupo ha sido liberado en
      <strong>CONIITI 2026</strong>.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
    <p style="color:#999;font-size:12px;">
      Este es un correo automático, por favor no respondas a este mensaje.
    </p>
  </div>
</body>
</html>"""


def html_generica(message: str) -> str:
    return f"""
<p style="font-family:Arial,sans-serif;font-size:16px;color:#333;">
  {message}
</p>
"""
import html
import resend
from app.config import settings

resend.api_key = settings.RESEND_API_KEY

FROM_EMAIL = "EasyDocs <noreply@edudynamis.org>"
SUPPORT_EMAIL = "clientes@edudynamis.org"

# Colores de la marca (cambiarlos aquí cambia todos los correos)
INK = "#1a2b4a"  # encabezado y títulos
ACCENT = "#2952cc"  # botones y enlaces
TEXT = "#374151"  # texto normal
MUTED = "#6b7280"  # texto secundario
LINE = "#e5e7eb"  # bordes
PAGE = "#f3f5f9"  # fondo alrededor de la tarjeta
DANGER = "#b91c1c"
SUCCESS = "#15803d"

FONT = "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

MONTHS_ES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
]

PLAN_LABELS = {
    "free": "Free",
    "basic": "Básico",
    "professional": "Profesional",
    "enterprise": "Empresarial",
}


# --- Piezas ---------------------------------------------------------------
def _e(value) -> str:
    """Escapa texto que viene de usuarios antes de meterlo en el HTML."""
    return html.escape(str(value if value is not None else ""))


def _app_url(path: str = "") -> str:
    return settings.FRONTEND_URL.rstrip("/") + path


def _first_name(full_name: str) -> str:
    return (full_name or "").strip().split(" ")[0] or "hola"


def _date_es(value) -> str:
    """'13 de octubre de 2026' sin depender del idioma del servidor."""
    return f"{value.day} de {MONTHS_ES[value.month - 1]} de {value.year}"


def _p(
    text_html: str, color: str = TEXT, size: int = 15, margin: str = "0 0 16px 0"
) -> str:
    return (
        f'<p style="margin:{margin};font-family:{FONT};font-size:{size}px;'
        f'line-height:1.6;color:{color};">{text_html}</p>'
    )


def _button(url: str, label: str, color: str = ACCENT) -> str:
    """Botón 'a prueba de Outlook' (tabla con fondo, no solo un enlace con padding)."""
    return f"""
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;">
  <tr>
    <td style="border-radius:8px;background:{color};">
      <a href="{_e(url)}" target="_blank"
         style="display:inline-block;padding:13px 26px;font-family:{FONT};font-size:15px;
                font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">{_e(label)}</a>
    </td>
  </tr>
</table>"""


def _code(code: str) -> str:
    return f"""
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px 0;">
  <tr>
    <td style="background:#f1f4fb;border:1px solid #dbe3f5;border-radius:10px;padding:14px 28px;">
      <span style="font-family:Consolas,'Courier New',monospace;font-size:30px;font-weight:700;
                   letter-spacing:10px;color:{INK};">{_e(code)}</span>
    </td>
  </tr>
</table>"""


def _details(rows: list[tuple[str, str]], accent: str = LINE) -> str:
    """Bloque de datos 'Etiqueta: valor'. Los valores ya deben venir escapados."""
    cells = "".join(f"""<tr>
  <td style="padding:6px 0;font-family:{FONT};font-size:13px;color:{MUTED};width:38%;vertical-align:top;">{label}</td>
  <td style="padding:6px 0;font-family:{FONT};font-size:14px;color:{INK};font-weight:600;vertical-align:top;">{value}</td>
</tr>""" for label, value in rows)
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="margin:4px 0 24px 0;border-left:3px solid {accent};background:#fafbfc;border-radius:0 8px 8px 0;">
  <tr><td style="padding:12px 18px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">{cells}</table>
  </td></tr>
</table>"""


def _steps(items: list[tuple[str, str]]) -> str:
    """Lista ordenada de pasos (título, descripción)."""
    rows = "".join(f"""<tr>
  <td style="width:34px;vertical-align:top;padding:0 0 14px 0;">
    <div style="width:24px;height:24px;border-radius:12px;background:#e8edfb;color:{ACCENT};
                font-family:{FONT};font-size:13px;font-weight:700;line-height:24px;text-align:center;">{i}</div>
  </td>
  <td style="vertical-align:top;padding:2px 0 14px 0;font-family:{FONT};font-size:14px;line-height:1.5;color:{TEXT};">
    <strong style="color:{INK};">{title}</strong><br>{desc}
  </td>
</tr>""" for i, (title, desc) in enumerate(items, start=1))
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px 0;">{rows}</table>"""


def _layout(*, topic: str, preheader: str, title: str, body: str, reason: str) -> str:
    """Plantilla común.

    topic: tema del correo, se ve en el encabezado ("Seguridad", "Facturación"...).
    preheader: texto que los clientes de correo muestran junto al asunto.
    reason: por qué la persona recibe este correo (va en el pie).
    """
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>{_e(title)}</title>
</head>
<body style="margin:0;padding:0;background:{PAGE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:{PAGE};">{_e(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{PAGE};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:560px;background:#ffffff;border:1px solid {LINE};border-radius:14px;overflow:hidden;">
        <tr>
          <td style="background:{INK};padding:20px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-family:{FONT};font-size:19px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">
                  EasyDocs
                </td>
                <td align="right" style="font-family:{FONT};font-size:13px;color:#b9c6e4;">{_e(topic)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 12px 32px;">
            <h1 style="margin:0 0 16px 0;font-family:{FONT};font-size:22px;line-height:1.3;font-weight:700;color:{INK};">{_e(title)}</h1>
            {body}
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px 32px;">
            <div style="border-top:1px solid {LINE};padding-top:16px;font-family:{FONT};font-size:13px;line-height:1.6;color:{MUTED};">
              ¿Dudas? Escríbenos a
              <a href="mailto:{SUPPORT_EMAIL}" style="color:{ACCENT};text-decoration:none;">{SUPPORT_EMAIL}</a>.
            </div>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td style="padding:16px 32px 0 32px;font-family:{FONT};font-size:12px;line-height:1.6;color:#9ca3af;text-align:center;">
            {_e(reason)}<br>
            EasyDocs, gestión documental para instituciones ETDH. Un producto de EduDynamis.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>"""


def _text(*parts: str) -> str:
    """Versión en texto plano: párrafos separados por una línea en blanco."""
    footer = (
        f"¿Dudas? Escríbenos a {SUPPORT_EMAIL}.\nEasyDocs, un producto de EduDynamis."
    )
    return "\n\n".join([p for p in parts if p] + [footer])


def _send(
    to: str, subject: str, html_body: str, text_body: str, attachments=None
) -> None:
    payload = {
        "from": FROM_EMAIL,
        "to": [to],
        "reply_to": SUPPORT_EMAIL,
        "subject": subject,
        "html": html_body,
        "text": text_body,
    }
    if attachments:
        payload["attachments"] = attachments
    resend.Emails.send(payload)


# --- Correos --------------------------------------------------------------
def send_2fa_code_email(to_email: str, code: str, full_name: str):
    name = _first_name(full_name)
    body = (
        _p(
            f"Hola, {_e(name)}. Usa este código para terminar de iniciar sesión en EasyDocs:"
        )
        + _code(code)
        + _p(
            "El código vence en <strong>5 minutos</strong> y solo sirve una vez. "
            "Si no estabas iniciando sesión, ignora este correo y cambia tu contraseña.",
            color=MUTED,
            size=13,
        )
    )
    _send(
        to_email,
        f"Tu código de verificación: {code}",
        _layout(
            topic="Inicio de sesión",
            preheader=f"Tu código es {code}. Vence en 5 minutos.",
            title="Tu código de verificación",
            body=body,
            reason="Recibes este correo porque alguien intentó iniciar sesión con tu cuenta.",
        ),
        _text(
            f"Hola, {name}.",
            f"Tu código de verificación de EasyDocs es: {code}",
            "Vence en 5 minutos. Si no estabas iniciando sesión, ignora este correo y cambia tu contraseña.",
        ),
    )


def send_password_reset_email(to_email: str, reset_url: str, full_name: str):
    name = _first_name(full_name)
    body = (
        _p(
            f"Hola, {_e(name)}. Recibimos una solicitud para cambiar la contraseña de tu cuenta. "
            "Para crear una nueva, usa este botón:"
        )
        + _button(reset_url, "Crear nueva contraseña")
        + _p(
            "El enlace vence en <strong>1 hora</strong>. Si no pediste el cambio, ignora este correo: "
            "tu contraseña actual sigue funcionando.",
            color=MUTED,
            size=13,
        )
    )
    _send(
        to_email,
        "Cambia tu contraseña de EasyDocs",
        _layout(
            topic="Seguridad",
            preheader="El enlace para crear una nueva contraseña vence en 1 hora.",
            title="Crea una nueva contraseña",
            body=body,
            reason="Recibes este correo porque se pidió cambiar la contraseña de tu cuenta.",
        ),
        _text(
            f"Hola, {name}.",
            f"Para crear una nueva contraseña, abre este enlace (vence en 1 hora):\n{reset_url}",
            "Si no pediste el cambio, ignora este correo.",
        ),
    )


def send_welcome_email(to_email: str, full_name: str, institution_name: str):
    name = _first_name(full_name)
    login_url = _app_url("/login")
    body = (
        _p(
            f"Hola, {_e(name)}. La cuenta de <strong>{_e(institution_name)}</strong> ya está lista. "
            "Para tener tus primeros documentos reglamentarios, te sugerimos este orden:"
        )
        + _steps(
            [
                (
                    "Registra tus programas",
                    "Con su resolución, horas y tipo de certificado.",
                ),
                (
                    "Agrega estudiantes y matrículas",
                    "Uno a uno o desde la plantilla de Excel.",
                ),
                (
                    "Genera tus documentos",
                    "Libros LR001 a LR009 con los datos de tu institución ya incluidos.",
                ),
            ]
        )
        + _button(login_url, "Entrar a EasyDocs")
    )
    _send(
        to_email,
        f"Bienvenido a EasyDocs, {name}",
        _layout(
            topic="Bienvenida",
            preheader=f"La cuenta de {institution_name} ya está lista.",
            title="Tu institución ya está en EasyDocs",
            body=body,
            reason="Recibes este correo porque registraste tu institución en EasyDocs.",
        ),
        _text(
            f"Hola, {name}. La cuenta de {institution_name} ya está lista.",
            "Te sugerimos empezar así:\n"
            "1. Registra tus programas.\n"
            "2. Agrega estudiantes y matrículas.\n"
            "3. Genera tus documentos reglamentarios (LR001 a LR009).",
            f"Entra aquí: {login_url}",
        ),
    )


def send_new_device_email(
    to_email: str, full_name: str, ip_address: str, user_agent: str, block_url: str
):
    name = _first_name(full_name)
    body = (
        _p(
            f"Hola, {_e(name)}. Alguien inició sesión en tu cuenta desde un dispositivo "
            "que no habíamos visto antes:"
        )
        + _details(
            [("Dirección IP", _e(ip_address)), ("Dispositivo", _e(user_agent))],
            accent="#f59e0b",
        )
        + _p(
            "Si fuiste tú, no tienes que hacer nada. Si no reconoces este inicio de sesión, bloquea tu cuenta ahora:"
        )
        + _button(block_url, "No fui yo: bloquear mi cuenta", color=DANGER)
        + _p(
            "Al bloquearla se cierra el acceso de inmediato. Después escríbenos para recuperarla.",
            color=MUTED,
            size=13,
        )
    )
    _send(
        to_email,
        "Nuevo inicio de sesión en tu cuenta de EasyDocs",
        _layout(
            topic="Seguridad",
            preheader="Se inició sesión desde un dispositivo nuevo. Revisa si fuiste tú.",
            title="Nuevo inicio de sesión",
            body=body,
            reason="Recibes este correo para proteger tu cuenta cuando se usa un dispositivo nuevo.",
        ),
        _text(
            f"Hola, {name}. Alguien inició sesión en tu cuenta desde un dispositivo nuevo.",
            f"Dirección IP: {ip_address}\nDispositivo: {user_agent}",
            f"Si no fuiste tú, bloquea tu cuenta aquí: {block_url}",
        ),
    )


def send_email_change_code(to_email: str, code: str, full_name: str):
    name = _first_name(full_name)
    body = (
        _p(
            f"Hola, {_e(name)}. Pediste usar este correo en tu cuenta de EasyDocs. "
            "Para confirmar que es tuyo, escribe este código:"
        )
        + _code(code)
        + _p(
            "El código vence en <strong>10 minutos</strong>. Si no pediste este cambio, ignora este correo.",
            color=MUTED,
            size=13,
        )
    )
    _send(
        to_email,
        f"Confirma tu nuevo correo: {code}",
        _layout(
            topic="Tu cuenta",
            preheader=f"Tu código es {code}. Vence en 10 minutos.",
            title="Confirma tu nuevo correo",
            body=body,
            reason="Recibes este correo porque se pidió asociar esta dirección a una cuenta de EasyDocs.",
        ),
        _text(
            f"Hola, {name}.",
            f"Tu código para confirmar el nuevo correo es: {code}",
            "Vence en 10 minutos. Si no pediste este cambio, ignora este correo.",
        ),
    )


def send_email_changed_notice(old_email: str, full_name: str, new_email: str):
    name = _first_name(full_name)
    body = (
        _p(f"Hola, {_e(name)}. El correo de tu cuenta de EasyDocs cambió:")
        + _details(
            [("Correo anterior", _e(old_email)), ("Correo nuevo", _e(new_email))]
        )
        + _p(
            "Por seguridad cerramos todas tus sesiones abiertas. Desde ahora inicias sesión con el correo nuevo."
        )
        + _p(
            f"Si no hiciste este cambio, escríbenos de inmediato a "
            f'<a href="mailto:{SUPPORT_EMAIL}" style="color:{ACCENT};">{SUPPORT_EMAIL}</a>.',
            color=DANGER,
            size=14,
        )
    )
    _send(
        old_email,
        "El correo de tu cuenta de EasyDocs cambió",
        _layout(
            topic="Seguridad",
            preheader=f"Tu cuenta ahora usa {new_email}.",
            title="Cambiaste el correo de tu cuenta",
            body=body,
            reason="Te avisamos a tu correo anterior para que sepas de cualquier cambio en tu cuenta.",
        ),
        _text(
            f"Hola, {name}. El correo de tu cuenta de EasyDocs cambió a {new_email}.",
            "Cerramos todas tus sesiones abiertas por seguridad.",
            f"Si no hiciste este cambio, escríbenos de inmediato a {SUPPORT_EMAIL}.",
        ),
    )


def send_invoice_email(
    to_email: str, full_name: str, invoice_number: str, plan_label: str, pdf_base64: str
):
    name = _first_name(full_name)
    plan_name = PLAN_LABELS.get(plan_label, plan_label)
    body = (
        _p(f"Hola, {_e(name)}. Confirmamos tu pago y tu plan ya está activo.")
        + _details(
            [
                (
                    "Plan",
                    f'{_e(plan_name)} <span style="color:{SUCCESS};font-weight:600;">(activo)</span>',
                ),
                ("Factura", _e(invoice_number)),
            ],
            accent=SUCCESS,
        )
        + _p(
            "La factura va adjunta en PDF. También la encuentras en EasyDocs, en Suscripción."
        )
        + _button(_app_url("/suscripcion"), "Ver mi suscripción")
    )
    _send(
        to_email,
        f"Factura {invoice_number}: tu plan {plan_name} está activo",
        _layout(
            topic="Facturación",
            preheader=f"Tu plan {plan_name} está activo. Adjuntamos la factura {invoice_number}.",
            title=f"Tu plan {plan_name} está activo",
            body=body,
            reason="Recibes este correo porque se confirmó un pago de tu institución.",
        ),
        _text(
            f"Hola, {name}. Confirmamos tu pago y tu plan {plan_name} ya está activo.",
            f"Adjuntamos la factura {invoice_number} en PDF. También está en EasyDocs, en Suscripción.",
        ),
        attachments=[{"filename": f"{invoice_number}.pdf", "content": pdf_base64}],
    )


def send_event_reminder_email(
    to_email: str,
    full_name: str,
    institution_name: str,
    event_title: str,
    event_date,
    description: str,
):
    name = _first_name(full_name)
    fecha = _date_es(event_date)
    rows = [("Evento", _e(event_title)), ("Fecha", _e(fecha))]
    if description:
        rows.append(("Detalle", _e(description)))
    body = (
        _p(
            f"Hola, {_e(name)}. <strong>{_e(institution_name)}</strong> tiene un evento obligatorio próximo:"
        )
        + _details(rows, accent=DANGER)
        + _p(
            "Cuando lo cumplas, márcalo como completado en el calendario para no recibir más recordatorios."
        )
        + _button(_app_url("/calendario"), "Abrir el calendario")
    )
    _send(
        to_email,
        f"Recordatorio: {event_title}, {fecha}",
        _layout(
            topic="Calendario",
            preheader=f"{event_title}: {fecha}.",
            title=event_title,
            body=body,
            reason="Recibes este correo porque tu institución tiene eventos obligatorios en su calendario de EasyDocs.",
        ),
        _text(
            f"Hola, {name}. {institution_name} tiene un evento obligatorio próximo:",
            f"{event_title}\nFecha: {fecha}"
            + (f"\n{description}" if description else ""),
            f"Abre el calendario: {_app_url('/calendario')}",
        ),
    )

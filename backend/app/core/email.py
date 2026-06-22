import resend
import os
from app.config import settings

resend.api_key = settings.RESEND_API_KEY


def send_password_reset_email(to_email: str, reset_url: str, full_name: str):
    resend.Emails.send(
        {
            "from": "EasyDocs <noreply@edudynamis.com>",
            "to": [to_email],
            "subject": "Recupera tu contraseña — EasyDocs",
            "html": f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #1a2b4a; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">EasyDocs</h1>
                <p style="color: #93c5fd; margin: 8px 0 0 0; font-size: 14px;">Gestión Documental ETDH</p>
            </div>
            
            <h2 style="color: #1a2b4a; font-size: 20px;">Hola, {full_name}</h2>
            <p style="color: #4b5563; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en EasyDocs.
                Haz clic en el botón de abajo para crear una nueva contraseña.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="{reset_url}" 
                   style="background: #2952cc; color: white; padding: 14px 32px; border-radius: 8px; 
                          text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                    Restablecer contraseña
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
                Este enlace expirará en <strong>1 hora</strong>. Si no solicitaste restablecer tu contraseña, 
                puedes ignorar este correo.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                    EasyDocs · EduDynamis · soporte@edudynamis.com
                </p>
            </div>
        </div>
        """,
        }
    )

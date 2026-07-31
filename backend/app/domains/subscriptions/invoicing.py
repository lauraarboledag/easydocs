from app.core.pdf_engine import render_pdf
from datetime import datetime

INVOICE_TEMPLATE = """<!DOCTYPE html><html><head><meta charset='utf-8'><style>
body{font-family:Arial,sans-serif;margin:60px;font-size:11pt;color:#1a2b4a;}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;border-bottom:3px solid #1a2b4a;padding-bottom:20px;}
.header h1{font-size:20px;margin:0;}
.header p{margin:2px 0;font-size:10pt;color:#6b7280;}
.invoice-title{text-align:right;}
.invoice-title h2{font-size:16pt;margin:0;text-transform:uppercase;letter-spacing:1px;}
.invoice-title p{margin:4px 0;font-size:10pt;color:#6b7280;}
.info-grid{display:flex;justify-content:space-between;margin:30px 0;}
.info-box{width:48%;}
.info-box h3{font-size:9pt;text-transform:uppercase;color:#6b7280;margin:0 0 8px 0;letter-spacing:0.5px;}
.info-box p{margin:2px 0;font-size:10pt;}
table{width:100%;border-collapse:collapse;margin:30px 0;}
th{background-color:#1a2b4a;color:#fff;text-align:left;padding:10px 12px;font-size:9pt;text-transform:uppercase;}
td{padding:14px 12px;border-bottom:1px solid #e5e7eb;font-size:10pt;}
.total-row td{font-weight:bold;font-size:12pt;border-top:2px solid #1a2b4a;border-bottom:none;}
.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:9pt;font-weight:bold;}
.badge-paid{background-color:#f0fdf4;color:#16a34a;}
.footer{margin-top:60px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;font-size:9pt;color:#9ca3af;}
</style></head><body>
<div class='header'>
  <div>
    <h1>EasyDocs</h1>
    <p>EduDynamis · Asesores Educativos</p>
    <p>soporte@edudynamis.com</p>
  </div>
  <div class='invoice-title'>
    <h2>Factura</h2>
    <p>N° {{ invoice_number }}</p>
    <p>{{ issued_date }}</p>
  </div>
</div>

<div class='info-grid'>
  <div class='info-box'>
    <h3>Facturado a</h3>
    <p><strong>{{ institution_name }}</strong></p>
    <p>{{ municipality }}, {{ department }}</p>
    <p>NIT/Código DANE: {{ dane_code }}</p>
  </div>
  <div class='info-box' style='text-align:right;'>
    <h3>Estado</h3>
    <span class='badge badge-paid'>Pagado</span>
    <p style='margin-top:10px;'>Método: {{ payment_method_label }}</p>
  </div>
</div>

<table>
  <tr><th>Concepto</th><th>Ciclo</th><th style='text-align:right;'>Valor</th></tr>
  <tr>
    <td>Plan {{ plan_label }} — EasyDocs</td>
    <td>{{ billing_cycle_label }}</td>
    <td style='text-align:right;'>{{ amount_formatted }}</td>
  </tr>
  <tr class='total-row'>
    <td colspan='2'>Total</td>
    <td style='text-align:right;'>{{ amount_formatted }}</td>
  </tr>
</table>

<div class='footer'>
  <p>Esta factura fue generada automáticamente por EasyDocs al confirmarse tu pago.</p>
  <p>EduDynamis · Asesores Educativos · soporte@edudynamis.com</p>
</div>
</body></html>"""


PLAN_LABELS = {
    "free": "Free",
    "basic": "Básico",
    "professional": "Profesional",
    "enterprise": "Empresarial",
}

CYCLE_LABELS = {
    "monthly": "Mensual",
    "annual": "Anual",
}

PAYMENT_METHOD_LABELS = {
    "wompi": "Pago en línea (Wompi)",
    "transfer": "Transferencia bancaria",
}


def generate_invoice_number(db) -> str:
    """Genera un número de factura secuencial tipo EDF-000001."""
    from app.domains.subscriptions.models import Invoice
    from sqlalchemy import func, select

    count = db.execute(select(func.count()).select_from(Invoice)).scalar()
    next_number = (count or 0) + 1
    return f"EDF-{next_number:06d}"


def render_invoice_pdf(invoice, institution) -> bytes:
    """Genera el PDF de una factura ya creada."""
    context = {
        "invoice_number": invoice.invoice_number,
        "issued_date": invoice.issued_at.strftime("%d de %B de %Y"),
        "institution_name": institution.name,
        "municipality": institution.municipality,
        "department": institution.department,
        "dane_code": institution.dane_code,
        "plan_label": PLAN_LABELS.get(invoice.plan_name, invoice.plan_name),
        "billing_cycle_label": CYCLE_LABELS.get(
            invoice.billing_cycle, invoice.billing_cycle
        ),
        "payment_method_label": PAYMENT_METHOD_LABELS.get(
            invoice.payment_method, invoice.payment_method
        ),
        "amount_formatted": f"${invoice.amount / 100:,.0f} COP",
    }
    return render_pdf(INVOICE_TEMPLATE, context)

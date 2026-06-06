from jinja2 import Environment, BaseLoader
from weasyprint import HTML
import tempfile
import os

def render_pdf(template_html: str, context: dict, institution: dict = None) -> bytes:
    """
    Renderiza el PDF inyectando tanto los datos del formulario
    como los datos institucionales automáticamente.
    """
    env = Environment(loader=BaseLoader())
    template = env.from_string(template_html)

    # Combina datos del formulario con datos institucionales
    full_context = {**context}
    if institution:
        full_context["institucion"] = institution

    rendered_html = template.render(**full_context)

    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
        f.write(rendered_html)
        tmp_path = f.name

    try:
        pdf_bytes = HTML(filename=tmp_path).write_pdf()
    finally:
        os.unlink(tmp_path)

    return pdf_bytes
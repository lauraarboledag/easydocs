from jinja2 import Environment, BaseLoader
from weasyprint import HTML
import tempfile
import os
import html


def _build_table_rows_html(rows: list) -> str:
    """Convierte una lista de filas (cada fila, una lista de celdas de
    texto) en el HTML real <tr><td>...</td></tr> que reemplaza a
    {{ filas_x }} dentro de la plantilla. Cada celda se escapa para que
    el texto que escriba el representative no rompa la estructura de la
    tabla (comillas, símbolos < >, etc.)."""
    if not rows:
        return ""
    trs = []
    for row in rows:
        tds = "".join(f"<td>{html.escape(str(cell))}</td>" for cell in row)
        trs.append(f"<tr>{tds}</tr>")
    return "".join(trs)


def _prepare_table_context(context: dict, table_columns: dict) -> dict:
    """Para cada campo declarado en table_columns de la plantilla, si su
    valor en el contexto es una lista de filas (el formato que envía el
    formulario de tabla de DocumentNew.jsx), la reemplaza por el HTML de
    filas ya armado. Los campos que no sean de tabla no se tocan."""
    if not table_columns:
        return context
    prepared = dict(context)
    for field in table_columns:
        value = prepared.get(field)
        if isinstance(value, list):
            prepared[field] = _build_table_rows_html(value)
    return prepared


def render_pdf(
    template_html: str,
    context: dict,
    institution: dict = None,
    table_columns: dict = None,
) -> bytes:
    """
    Renderiza el PDF inyectando tanto los datos del formulario
    como los datos institucionales automáticamente.
    """
    env = Environment(loader=BaseLoader())
    template = env.from_string(template_html)

    full_context = _prepare_table_context(context, table_columns or {})
    if institution:
        full_context["institucion"] = institution

    rendered_html = template.render(**full_context)

    with tempfile.NamedTemporaryFile(
        suffix=".html", delete=False, mode="w", encoding="utf-8"
    ) as f:
        f.write(rendered_html)
        tmp_path = f.name

    try:
        pdf_bytes = HTML(filename=tmp_path).write_pdf()
    finally:
        os.unlink(tmp_path)

    return pdf_bytes


def render_html_preview(
    template_html: str,
    context: dict,
    institution: dict = None,
    table_columns: dict = None,
) -> str:
    """
    Renderiza el HTML con Jinja2 sin generar PDF.
    Usado para la vista previa en el frontend.
    """
    env = Environment(loader=BaseLoader())
    template = env.from_string(template_html)

    full_context = _prepare_table_context(context, table_columns or {})
    if institution:
        full_context["institucion"] = institution

    return template.render(**full_context)

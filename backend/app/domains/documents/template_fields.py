"""Deriva required_fields y table_columns a partir del template_html.

Es la fuente de verdad del backend: así una plantilla nunca queda con
campos o tablas desincronizados, venga del editor visual, de Swagger,
de un script de seed o de una base reconstruida.
"""

import html
import re

# {% if variable %}, {% endif %} y {{ variable }} (con o sin filtros)
_TOKEN_RE = re.compile(
    r"\{%-?\s*if\s+([\w.]+)\s*-?%\}"
    r"|\{%-?\s*(endif)\s*-?%\}"
    r"|\{\{\s*([\w.]+)\s*(?:\|[^}]*)?\}\}"
)
_TABLE_RE = re.compile(r"<table\b[^>]*>(.*?)</table>", re.IGNORECASE | re.DOTALL)
_CELL_RE = re.compile(r"<(td|th)\b[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL)
_ROW_RE = re.compile(r"<tr\b[^>]*>(.*?)</tr>", re.IGNORECASE | re.DOTALL)
_TH_RE = re.compile(r"<th\b[^>]*>(.*?)</th>", re.IGNORECASE | re.DOTALL)
_VAR_RE = re.compile(r"\{\{\s*([\w.]+)\s*(?:\|[^}]*)?\}\}")
_TAG_RE = re.compile(r"<[^>]+>")


class TemplateFieldsError(ValueError):
    """La plantilla tiene una estructura que no se puede interpretar."""


def _is_institutional(name: str) -> bool:
    return name.startswith("institucion.")


def derive_required_fields(template_html: str) -> list[str]:
    """Variables que debe llenar el usuario, en orden de aparición.

    Incluye las variables de condición ({% if es_menor_edad %}); excluye
    las institucion.*, que llena el backend.
    """
    seen: dict[str, None] = {}
    for m in _TOKEN_RE.finditer(template_html or ""):
        name = m.group(1) or m.group(3)
        if name and not _is_institutional(name):
            seen.setdefault(name, None)
    return list(seen)


def derive_table_columns(template_html: str) -> dict[str, list[str]]:
    """Tablas dinámicas: una variable suelta dentro de <table> (fuera de
    cualquier celda), con sus columnas tomadas de la última fila de <th>
    que va antes de ella.

        <table><tr><th>Módulo</th><th>Nota</th></tr>{{ filas_x }}</table>
        -> {"filas_x": ["Módulo", "Nota"]}
    """
    columns: dict[str, list[str]] = {}
    for table in _TABLE_RE.finditer(template_html or ""):
        inner = table.group(1)
        outside_cells = _CELL_RE.sub("", inner)
        for var in _VAR_RE.finditer(outside_cells):
            name = var.group(1)
            if _is_institutional(name):
                continue
            # Posición real de la variable dentro de la tabla
            pos = inner.find(var.group(0))
            header = []
            for row in _ROW_RE.finditer(inner[:pos]):
                ths = _TH_RE.findall(row.group(1))
                if ths:
                    header = [html.unescape(_TAG_RE.sub("", th)).strip() for th in ths]
            if not header:
                raise TemplateFieldsError(
                    f"La tabla dinámica '{name}' no tiene una fila de encabezados (<th>)."
                )
            columns[name] = header
    return columns


def derive_template_fields(
    template_html: str,
) -> tuple[list[str], dict[str, list[str]]]:
    return derive_required_fields(template_html), derive_table_columns(template_html)

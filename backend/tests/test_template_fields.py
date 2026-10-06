"""Pruebas de la derivación de campos de plantillas.

Ejecutar desde la carpeta backend:  pytest tests/test_template_fields.py -v
"""
import pytest
from app.domains.documents.template_fields import (
    TemplateFieldsError,
    derive_required_fields,
    derive_table_columns,
)


def test_campos_en_orden_y_sin_institucionales():
    html = "<p>{{ institucion.nombre }} {{ nombre_estudiante }} {{ folio }} {{ nombre_estudiante }}</p>"
    assert derive_required_fields(html) == ["nombre_estudiante", "folio"]


def test_condicion_y_campos_condicionales():
    html = "{% if es_menor_edad %}<p>{{ nombre_representante }}</p>{% endif %}"
    assert derive_required_fields(html) == ["es_menor_edad", "nombre_representante"]


def test_filtros_jinja_y_logo():
    html = (
        "{% if institucion.logo_url %}<div style=\"text-align:{{ institucion.logo_align|default('left') }}\">"
        "</div>{% endif %}<p>{{ dia }}</p>"
    )
    assert derive_required_fields(html) == ["dia"]


def test_tabla_dinamica_con_encabezados():
    html = "<table><tr><th>M&oacute;dulo</th><th><strong>Nota</strong></th></tr>{{ filas_x }}</table>"
    assert derive_table_columns(html) == {"filas_x": ["Módulo", "Nota"]}


def test_tabla_de_datos_no_es_dinamica():
    html = "<table><tr><th>Nombre</th><td>{{ nombre_estudiante }}</td></tr></table>"
    assert derive_table_columns(html) == {}


def test_dos_tablas_dinamicas():
    html = (
        "<table><tr><th>A</th></tr>{{ filas_1 }}</table>"
        "<table><tr><th>B</th><th>C</th></tr>{{ filas_2 }}</table>"
    )
    assert derive_table_columns(html) == {"filas_1": ["A"], "filas_2": ["B", "C"]}


def test_tabla_dinamica_sin_encabezados_falla():
    with pytest.raises(TemplateFieldsError):
        derive_table_columns("<table>{{ filas_x }}</table>")
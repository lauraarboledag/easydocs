"""Plantillas reglamentarias de EasyDocs (Decreto 1075 de 2015)."""

import sys
from app.database import SessionLocal
from app.domains.institutions.models import Institution  # noqa: F401
from app.domains.users.models import User  # noqa: F401
from app.domains.subscriptions.models import (
    Plan,
    Subscription,
    Transaction,
)  # noqa: F401
from app.domains.students.models import Program, Student, Enrollment  # noqa: F401
from app.domains.calendar.models import CalendarEvent  # noqa: F401
from app.domains.documents.models import (
    DocumentTemplate,
    DocumentType,
    Document,
)  # noqa: F401
from app.domains.documents.template_fields import derive_template_fields

# ---------------------------------------------------------------------------
# Encabezado y estilos compartidos.
# IMPORTANTE: mantener idéntico a HEADER_AND_STYLES en
# frontend/src/components/admin/templateEditor/compiler.js
# ---------------------------------------------------------------------------
BASE_HEAD = """<!DOCTYPE html><html><head><meta charset='utf-8'><style>
@page{size:letter;margin:2cm 2.2cm 2.4cm 2.2cm;
@bottom-left{content:string(institucion);font-family:'Liberation Sans',Arial,Helvetica,'DejaVu Sans',sans-serif;font-size:7.5pt;color:#6b7280;}
@bottom-right{content:'Página ' counter(page) ' de ' counter(pages);font-family:'Liberation Sans',Arial,Helvetica,'DejaVu Sans',sans-serif;font-size:7.5pt;color:#6b7280;}}
body{font-family:'Liberation Sans',Arial,Helvetica,'DejaVu Sans',sans-serif;font-size:10.5pt;color:#1f2937;line-height:1.5;margin:0;}
@media screen{body{max-width:760px;margin:32px auto;padding:0 24px;}}
.logo{margin-bottom:10px;}
.logo img{max-height:70px;max-width:180px;}
.marca-agua{position:fixed;top:50%;left:50%;width:13cm;height:13cm;margin-top:-6.5cm;margin-left:-6.5cm;opacity:0.07;z-index:-1;}
.marca-agua img{width:100%;height:100%;object-fit:contain;}
.header{text-align:center;padding-bottom:10px;margin-bottom:6px;border-bottom:2.5px solid #1a2b4a;}
.header p{margin:1px 0;font-size:8.5pt;color:#4b5563;text-align:center;}
.header p.inst-nombre{string-set:institucion content();font-size:13.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;color:#1a2b4a;margin-bottom:3px;}
.section h1{text-align:center;font-size:15pt;text-transform:uppercase;letter-spacing:1px;color:#1a2b4a;margin:22px 0 14px;}
.section h2{font-size:10pt;text-transform:uppercase;letter-spacing:0.5px;color:#ffffff;background-color:#1a2b4a;padding:5px 10px;margin:18px 0 8px;}
.section h3{font-size:10.5pt;color:#1a2b4a;border-bottom:1px solid #c9d1e0;padding-bottom:3px;margin:14px 0 6px;}
.section h4{font-size:9.5pt;text-transform:uppercase;color:#4b5563;margin:10px 0 4px;}
p{margin:6px 0;text-align:justify;}
p[style*='center']{text-align:center;margin:10px 0;}
p[style*='center'] strong{font-size:13.5pt;text-transform:uppercase;letter-spacing:0.5px;color:#1a2b4a;}
p[style*='right']{font-size:9.5pt;color:#374151;}
table{width:100%;border-collapse:collapse;margin:8px 0 12px;font-size:9.5pt;}
tr{page-break-inside:avoid;}
th{background-color:#eef1f7;color:#1a2b4a;text-align:left;padding:4px 8px;border:1px solid #c9d1e0;font-weight:bold;}
td{padding:4px 8px;border:1px solid #c9d1e0;}
tr>th:first-child:nth-last-child(2){width:34%;}
ul,ol{margin:6px 0;padding-left:22px;}
li{margin:3px 0;}
em{color:#4b5563;}
.firmas{display:flex;justify-content:space-around;margin-top:50px;page-break-inside:avoid;}
.firma{width:30%;text-align:center;}
.firma .linea{border-top:1px solid #1f2937;margin-bottom:4px;}
.firma p{margin:0;text-align:center;font-size:9pt;}
</style></head><body>
{% if institucion.logo_url %}<div class="logo" style="text-align:{{ institucion.logo_align|default('left') }};"><img src="{{ institucion.logo_url }}" /></div>{% if institucion.marca_agua %}<div class="marca-agua"><img src="{{ institucion.logo_url }}" /></div>{% endif %}{% endif %}
<div class='header'>
<p class="inst-nombre">{{ institucion.nombre }}</p>
<p>Institución de Educación para el Trabajo y el Desarrollo Humano</p>
<p>Licencia de Funcionamiento N° {{ institucion.licencia }} · {{ institucion.municipio }}, {{ institucion.departamento }}</p>
</div>"""

FOOTER = "</body></html>"


def page(body: str) -> str:
    return f'{BASE_HEAD}<div class="section">{body}</div>{FOOTER}'


def title(text: str) -> str:
    return f'<div class="section"><h1>{text}</h1></div>'


def h2(text: str) -> str:
    return f'<div class="section"><h2>{text}</h2></div>'


def data_table(rows) -> str:
    """Tabla de datos: una variable por fila (así la entiende el editor)."""
    html = "".join(
        f"<tr><th>{label}</th><td>{{{{ {var} }}}}</td></tr>" for label, var in rows
    )
    return f"<table>{html}</table>"


def dynamic_table(var: str, columns) -> str:
    head = "".join(f"<th>{c}</th>" for c in columns)
    return f"<table><tr>{head}</tr>{{{{ {var} }}}}</table>"


def firmas(*labels) -> str:
    inner = "".join(
        f'<div class="firma"><div class="linea"></div><p><strong>{label}</strong></p></div>'
        for label in labels
    )
    return f'<div class="firmas">{inner}</div>'


def center(html: str) -> str:
    return f'<p style="text-align:center">{html}</p>'


def right(html: str) -> str:
    return f'<p style="text-align:right">{html}</p>'


CIERRE_FECHA = "Para constancia se firma en {{ institucion.municipio }}, a los {{ dia }} días del mes de {{ mes }} de {{ anio }}."
DADO_EN = "Dado en {{ institucion.municipio }}, a los {{ dia }} días del mes de {{ mes }} de {{ anio }}."


def acta(titulo: str, encabezado_extra: str, seccion_final: str, var_final: str) -> str:
    return page(
        title(titulo)
        + encabezado_extra
        + "<p><strong>Lugar:</strong> {{ lugar }} · <strong>Fecha:</strong> {{ dia }} de {{ mes }} de {{ anio }} · <strong>Hora de inicio:</strong> {{ hora_inicio }}</p>"
        + h2("Asistentes")
        + "<p>{{ asistentes }}</p>"
        + h2("Ausentes")
        + "<p>{{ ausentes }}</p>"
        + h2("Propósito de la reunión")
        + "<p>{{ proposito }}</p>"
        + h2("Orden del día")
        + "<ol><li>Verificación del quórum.</li><li>Lectura y aprobación del acta anterior.</li>"
        "<li>{{ punto_3 }}</li><li>{{ punto_4 }}</li><li>{{ punto_5 }}</li></ol>"
        + h2("Desarrollo de la reunión")
        + "<p>{{ desarrollo }}</p>"
        + h2(seccion_final)
        + f"<p>{{{{ {var_final} }}}}</p>"
        + "<p><strong>Hora de finalización:</strong> {{ hora_fin }}</p>"
        + firmas("Rector / Director", "Secretario(a) del estamento")
    )


def certificado_aptitud(nota_extra: str = "") -> str:
    return page(
        center(
            "Con registro del programa según Resolución N° {{ resolucion_programa }}"
        )
        + '<p style="text-align:center">Confiere el</p>'
        + title("Certificado de Aptitud Ocupacional por Competencias")
        + center("Técnico Laboral en")
        + center("<strong>{{ nombre_programa }}</strong>")
        + center("con una intensidad de {{ total_horas }} horas, a")
        + center("<strong>{{ nombre_estudiante }}</strong>")
        + center(
            "identificado(a) con documento de identidad N° {{ documento_estudiante }} de {{ lugar_expedicion }},"
        )
        + center(
            "por haber cumplido los requisitos legales establecidos en el Decreto 1075 de 2015 y el plan de estudios conforme al Proyecto Educativo Institucional."
        )
        + nota_extra
        + center(
            "Registrado en el Libro de Certificados N° {{ numero_libro }}, folio {{ folio }}, el {{ fecha_registro }}."
        )
        + center(DADO_EN)
        + firmas("Rector / Director", "Secretario(a) académico(a)")
    )


TEMPLATES = [
    {
        "name": "Proyecto Educativo Institucional",
        "document_type": "LR001",
        "description": "Proyecto Educativo Institucional (PEI) — identificación, misión, visión y componentes institucionales.",
        "template_html": page(
            title("Proyecto Educativo Institucional")
            + h2("1. Identificación de la institución")
            + data_table(
                [
                    ("Nombre", "institucion.nombre"),
                    ("Nivel educativo", "institucion.nivel_educativo"),
                    ("Licencia de funcionamiento", "institucion.licencia"),
                    ("Municipio", "institucion.municipio"),
                    ("Departamento", "institucion.departamento"),
                    ("Dirección", "institucion.direccion"),
                    ("Teléfono", "institucion.telefono"),
                    ("Correo electrónico", "institucion.email"),
                ]
            )
            + h2("2. Misión")
            + "<p>{{ mision }}</p>"
            + h2("3. Visión")
            + "<p>{{ vision }}</p>"
            + h2("4. Principios y fines institucionales")
            + "<p>{{ principios_fines }}</p>"
            + h2("5. Programas registrados")
            + "<p>{{ programas_registrados }}</p>"
            + h2("6. Estrategia pedagógica")
            + "<p>{{ estrategia_pedagogica }}</p>"
            + h2("7. Organización administrativa")
            + "<p>{{ organizacion_administrativa }}</p>"
            + h2("8. Reglamento de estudiantes y formadores")
            + "<p>{{ reglamento }}</p>"
            + h2("9. Autoevaluación institucional")
            + "<p>{{ autoevaluacion }}</p>"
            + "<p>Aprobado en {{ institucion.municipio }}, a los {{ dia }} días del mes de {{ mes }} de {{ anio }}.</p>"
            + firmas("Rector / Director", "Representante de la comunidad educativa")
        ),
    },
    {
        "name": "Libro de Matrículas",
        "document_type": "LR002",
        "description": "Libro de Matrículas — datos del estudiante, representante legal (si aplica) y compromiso institucional.",
        "template_html": page(
            title("Libro de Matrículas")
            + right(
                "<strong>Folio:</strong> {{ folio }} · <strong>Matrícula N°:</strong> {{ numero_matricula }}"
            )
            + h2("Datos del estudiante")
            + data_table(
                [
                    ("Nombres y apellidos", "nombre_estudiante"),
                    ("Tipo de documento", "tipo_documento"),
                    ("Número de documento", "documento_estudiante"),
                    ("Lugar de expedición", "lugar_expedicion"),
                    ("Dirección de residencia", "direccion"),
                    ("Barrio", "barrio"),
                    ("Comuna", "comuna"),
                    ("Teléfono", "telefono_estudiante"),
                ]
            )
            + h2("Programa")
            + data_table(
                [
                    ("Programa", "nombre_programa"),
                    ("Certificado que otorga", "tipo_certificado"),
                ]
            )
            + '\n{% if es_menor_edad %}\n<div class="section">'
            + h2("Datos del representante legal")
            + data_table(
                [
                    ("Nombres y apellidos", "nombre_representante"),
                    ("Documento de identidad", "documento_representante"),
                    ("Dirección", "direccion_representante"),
                    ("Teléfono", "telefono_representante"),
                ]
            )
            + "</div>\n{% endif %}\n"
            + h2("Matrícula")
            + "<p><strong>Fecha de matrícula:</strong> {{ dia }} de {{ mes }} de {{ anio }}.</p>"
            + "<p>Con la firma del presente registro, los firmantes declaran conocer y aceptar el Proyecto Educativo Institucional y el reglamento de estudiantes de la institución.</p>"
            + firmas("Estudiante", "Personal administrativo", "Rector / Director")
        ),
    },
    {
        "name": "Actas de Participación Comunitaria",
        "document_type": "LR003",
        "description": "Acta del estamento de participación comunitaria — asistencia, propósito, desarrollo y acuerdos.",
        "template_html": acta(
            "Acta de Participación Comunitaria",
            center("{{ nombre_estamento }} — Acta N° {{ numero_acta }}"),
            "Propuestas, sugerencias y acuerdos",
            "acuerdos",
        ),
    },
    {
        "name": "Actas Pedagógicas y Disciplinarias",
        "document_type": "LR004",
        "description": "Acta del Estamento Pedagógico, Académico y Disciplinario — asistencia, propósito, desarrollo y compromisos.",
        "template_html": acta(
            "Acta del Estamento Pedagógico, Académico y Disciplinario",
            center("Acta N° {{ numero_acta }}"),
            "Propuestas, recomendaciones y compromisos",
            "compromisos",
        ),
    },
    {
        "name": "Registro de Certificados de Aptitud",
        "document_type": "LR005",
        "description": "Registro de Certificados de Aptitud Ocupacional otorgados — libro consolidado por institución.",
        "template_html": page(
            title("Registro de Certificados de Aptitud Ocupacional")
            + "<p>Verificada la situación legal y académica de cada uno de los estudiantes que cursaron y aprobaron los estudios correspondientes al programa de Educación para el Trabajo y el Desarrollo Humano, y confrontado que cumplieron los requisitos establecidos en la ley y en el Proyecto Educativo Institucional, se otorga el certificado de aptitud ocupacional a los estudiantes que se registran a continuación:</p>"
            + dynamic_table(
                "filas_datos_1",
                [
                    "N° orden",
                    "Fecha",
                    "Nombre completo",
                    "Documento de identidad",
                    "Certificado otorgado",
                    "Horas del programa",
                    "Firma de quien recibe",
                ],
            )
            + "<p>El presente registro consta de <strong>{{ total_estudiantes }}</strong> estudiantes; comienza con el nombre de <strong>{{ primer_nombre }}</strong> y termina con el nombre de <strong>{{ ultimo_nombre }}</strong>.</p>"
            + "<p>"
            + CIERRE_FECHA
            + "</p>"
            + firmas("Rector / Director", "Secretario(a) académico(a)")
        ),
    },
    {
        "name": "Autoevaluación Institucional",
        "document_type": "LR006",
        "description": "Registro de Autoevaluación Institucional — resultados, fortalezas, debilidades y plan de mejoramiento.",
        "template_html": page(
            title("Registro de Autoevaluación Institucional")
            + '<p style="text-align:center">Período {{ periodo }} · Año {{ anio }}</p>'
            + h2("1. Resultados de la autoevaluación")
            + "<p>{{ resultados_autoevaluacion }}</p>"
            + h2("2. Fortalezas identificadas")
            + "<p>{{ fortalezas }}</p>"
            + h2("3. Debilidades identificadas")
            + "<p>{{ debilidades }}</p>"
            + h2("4. Plan de mejoramiento")
            + dynamic_table(
                "filas_datos_1",
                ["Aspecto a mejorar", "Estrategia", "Responsable", "Fecha límite"],
            )
            + h2("5. Seguimiento al plan de mejoramiento anterior")
            + "<p>{{ seguimiento_plan }}</p>"
            + "<p>"
            + CIERRE_FECHA
            + "</p>"
            + firmas("Rector / Director", "Responsable del proceso de autoevaluación")
        ),
    },
    {
        "name": "Reconocimiento de Saberes Previos",
        "document_type": "LR007",
        "description": "Registro de Reconocimiento de Saberes Previos — valoración de conocimientos y experiencias previas del estudiante.",
        "template_html": page(
            title("Reconocimiento de Saberes Previos")
            + right("<strong>Folio:</strong> {{ folio }}")
            + h2("Datos del estudiante")
            + data_table(
                [
                    ("Nombres y apellidos", "nombre_estudiante"),
                    ("Tipo de documento", "tipo_documento"),
                    ("Número de documento", "documento_estudiante"),
                    ("Programa", "nombre_programa"),
                ]
            )
            + "<p><strong>Fecha de valoración:</strong> {{ dia }} de {{ mes }} de {{ anio }}.</p>"
            + h2("Valoración por módulo")
            + dynamic_table(
                "filas_datos_1",
                ["Módulo", "Docente responsable", "Valoración", "Aprobó (Sí/No)"],
            )
            + "<p><em>El mecanismo de valoración de conocimientos, experiencias y prácticas previamente adquiridas por los estudiantes está contenido en el Proyecto Educativo Institucional (PEI), conforme al artículo 2.6.4.15 del Decreto 1075 de 2015.</em></p>"
            + firmas("Docente responsable", "Rector / Director")
        ),
    },
    {
        "name": "Registro de Calificaciones Definitivas",
        "document_type": "LR008",
        "description": "Registro de calificaciones por módulo, actividades de recuperación y estado de aprobación del estudiante.",
        "template_html": page(
            title("Registro de Calificaciones Definitivas")
            + right(
                "<strong>Folio:</strong> {{ folio }} · <strong>Código de matrícula:</strong> {{ codigo_matricula }}"
            )
            + h2("Datos del estudiante")
            + data_table(
                [
                    ("Nombres y apellidos", "nombre_estudiante"),
                    ("Documento de identidad", "documento_estudiante"),
                    ("N° de matrícula", "numero_matricula"),
                    ("Programa", "nombre_programa"),
                    ("Año", "anio"),
                ]
            )
            + h2("Calificaciones por módulo")
            + dynamic_table(
                "filas_datos_1",
                ["Módulo", "Valoración", "Aprobó (Sí/No)", "Intensidad (horas)"],
            )
            + h2("Actividades de recuperación, habilitación o refuerzo")
            + dynamic_table(
                "filas_datos_2", ["Módulo", "Valoración", "Aprobó (Sí/No)", "Fecha"]
            )
            + firmas("Rector / Director", "Secretario(a) académico(a)")
        ),
    },
    {
        "name": "Registros Especiales (Duplicados)",
        "document_type": "LR009",
        "description": "Libro de Registros Especiales — para duplicados o modificaciones de certificados ya emitidos.",
        "template_html": page(
            title("Libro de Registros Especiales")
            + "<p><strong>Tipo de registro:</strong> {{ tipo_registro }}</p>"
            + h2("Datos del titular")
            + data_table(
                [
                    ("Nombres y apellidos", "nombre_estudiante"),
                    ("Documento de identidad", "documento_estudiante"),
                ]
            )
            + h2("Registro del certificado original")
            + data_table(
                [
                    ("Libro N°", "numero_libro"),
                    ("Folio", "folio"),
                    ("Registro inicial N°", "numero_registro"),
                ]
            )
            + h2("Observaciones")
            + "<p>{{ observaciones }}</p>"
            + "<p>"
            + CIERRE_FECHA
            + "</p>"
            + firmas("Rector / Director", "Titular del certificado")
        ),
    },
    {
        "name": "Certificado de Aptitud Ocupacional — Laboral",
        "document_type": "certificado_aptitud_laboral",
        "description": "Certificado de Aptitud Ocupacional por Competencias — programas de formación laboral.",
        "template_html": certificado_aptitud(),
    },
    {
        "name": "Certificado de Aptitud Ocupacional — Salud",
        "document_type": "certificado_aptitud_salud",
        "description": "Certificado de Aptitud Ocupacional por Competencias — programas del área de salud, incluye nota RETHUS.",
        "template_html": certificado_aptitud(
            "<p><em>Nota: para la plena validez de este certificado, el titular debe solicitar su inscripción en el Registro Único Nacional del Talento Humano en Salud (RETHUS), conforme al Decreto 4904 de 2009 y la Ley 1164 de 2007.</em></p>"
        ),
    },
    {
        "name": "Certificado de Conocimientos Académicos",
        "document_type": "certificado_conocimientos",
        "description": "Certifica que el estudiante culminó y aprobó satisfactoriamente el programa académico.",
        "template_html": page(
            center(
                "Con registro del programa según Resolución N° {{ resolucion_programa }}"
            )
            + title("Certificado de Conocimientos Académicos")
            + '<p style="text-align:center">Certifica que</p>'
            + center("<strong>{{ nombre_estudiante }}</strong>")
            + center(
                "identificado(a) con documento de identidad N° {{ documento_estudiante }} de {{ lugar_expedicion }},"
            )
            + center("culminó y aprobó satisfactoriamente el programa")
            + center("<strong>{{ nombre_programa }}</strong>")
            + center("con una intensidad horaria de {{ total_horas }} horas,")
            + center(
                "por haber cumplido los requisitos académicos establecidos en el Decreto 1075 de 2015 y el plan de estudios conforme al Proyecto Educativo Institucional, demostrando los conocimientos y competencias requeridos."
            )
            + center(
                "Registrado en el Libro de Certificados N° {{ numero_libro }}, folio {{ folio }}, el {{ fecha_registro }}."
            )
            + center(DADO_EN)
            + firmas("Rector / Director", "Secretario(a) académico(a)")
        ),
    },
    {
        "name": "Constancia de Asistencia",
        "document_type": "constancia_asistencia",
        "description": "Constancia de asistencia a curso de educación informal — no otorga certificación de aptitud.",
        "template_html": page(
            title("Constancia de Asistencia")
            + "<p><strong>{{ institucion.nombre }}</strong>, institución de Educación para el Trabajo y el Desarrollo Humano con domicilio en {{ institucion.municipio }}, {{ institucion.departamento }},</p>"
            + center("<strong>Hace constar que</strong>")
            + center("<strong>{{ nombre_estudiante }}</strong>")
            + center(
                "identificado(a) con documento de identidad N° {{ documento_estudiante }} expedido en {{ lugar_expedicion }},"
            )
            + "<p>asistió al curso <strong>{{ nombre_curso }}</strong>, con una duración de {{ duracion_horas }} horas.</p>"
            + "<p><em>La presente constancia se expide conforme al artículo 2.6.6.8 del Decreto 1075 de 2015 sobre educación informal, y no otorga certificado de aptitud ocupacional.</em></p>"
            + center(DADO_EN)
            + firmas("Representante legal", "Secretario(a) académico(a)")
        ),
    },
    {
        "name": "Constancia o Certificado de Estudio",
        "document_type": "constancia_estudio",
        "description": "Certifica que el estudiante se encuentra actualmente matriculado y cursando un programa.",
        "template_html": page(
            title("Constancia de Estudio")
            + "<p><strong>{{ institucion.nombre }}</strong>, institución de Educación para el Trabajo y el Desarrollo Humano con domicilio en {{ institucion.municipio }}, {{ institucion.departamento }},</p>"
            + center("<strong>Hace constar que</strong>")
            + center("<strong>{{ nombre_estudiante }}</strong>")
            + center(
                "identificado(a) con documento de identidad N° {{ documento_estudiante }} expedido en {{ lugar_expedicion }},"
            )
            + "<p>se encuentra actualmente matriculado(a) y cursando el programa <strong>{{ nombre_programa }}</strong>, con una intensidad horaria total de {{ total_horas }} horas, bajo la matrícula N° {{ numero_matricula }}.</p>"
            + "<p>La presente constancia se expide a solicitud del interesado, para los fines que estime convenientes.</p>"
            + center(DADO_EN)
            + firmas("Representante legal", "Secretario(a) académico(a)")
        ),
    },
]


def seed(update: bool = False, only: set | None = None):
    db = SessionLocal()
    created = updated = skipped = 0
    try:
        for t in TEMPLATES:
            if only and t["document_type"] not in only:
                continue
            required_fields, table_columns = derive_template_fields(t["template_html"])
            existing = (
                db.query(DocumentTemplate)
                .filter(
                    DocumentTemplate.document_type == DocumentType(t["document_type"])
                )
                .first()
            )
            if existing:
                if not update:
                    print(f"Ya existe: {t['name']} ({t['document_type']}) — omitida")
                    skipped += 1
                    continue
                existing.name = t["name"]
                existing.description = t["description"]
                existing.template_html = t["template_html"]
                existing.required_fields = required_fields
                existing.table_columns = table_columns
                existing.is_active = True
                updated += 1
                print(f"Actualizada: {t['name']} ({t['document_type']})")
                continue
            db.add(
                DocumentTemplate(
                    name=t["name"],
                    document_type=DocumentType(t["document_type"]),
                    description=t["description"],
                    template_html=t["template_html"],
                    required_fields=required_fields,
                    table_columns=table_columns,
                )
            )
            created += 1
            print(f"Creada: {t['name']} ({t['document_type']})")
        db.commit()
    finally:
        db.close()
    print(f"\nListo. {created} creadas, {updated} actualizadas, {skipped} omitidas.")


if __name__ == "__main__":
    only = None
    if "--only" in sys.argv:
        idx = sys.argv.index("--only")
        only = {x.strip() for x in sys.argv[idx + 1].split(",") if x.strip()}
    seed(update="--update" in sys.argv, only=only)

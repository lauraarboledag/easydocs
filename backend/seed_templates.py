from app.database import SessionLocal
from app.domains.institutions.models import Institution
from app.domains.users.models import User
from app.domains.subscriptions.models import Plan, Subscription, Transaction
from app.domains.students.models import Program, Student, Enrollment
from app.domains.calendar.models import CalendarEvent
from app.domains.documents.models import DocumentTemplate, DocumentType, Document
TEMPLATES = [
    {
        "name": "Proyecto Educativo Institucional",
        "document_type": "LR001",
        "description": "Proyecto Educativo Institucional (PEI) — identificación, misión, visión y componentes institucionales.",
        "required_fields": [
            "mision",
            "vision",
            "principios_fines",
            "programas_registrados",
            "estrategia_pedagogica",
            "organizacion_administrativa",
            "reglamento",
            "autoevaluacion",
            "dia",
            "mes",
            "anio",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:11pt;} .header{text-align:center;margin-bottom:40px;border-bottom:2px solid #000;padding-bottom:20px;} .header h1{font-size:14pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:16pt;font-weight:bold;text-transform:uppercase;margin:30px 0;letter-spacing:2px;} .section{margin:25px 0;} .section h2{font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:5px;margin-bottom:10px;} .section p{line-height:1.8;text-align:justify;} .dato{font-weight:bold;} .firmas{margin-top:80px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;} .footer{margin-top:30px;font-size:10pt;text-align:center;font-style:italic;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Licencia de Funcionamiento N° {{ institucion.licencia }} — {{ institucion.municipio }}, {{ institucion.departamento }}</p></div><div class='title'>Proyecto Educativo Institucional</div><div class='section'><h2>1. Identificación de la Institución</h2><p><span class='dato'>Nombre:</span> {{ institucion.nombre }}<br><span class='dato'>Municipio:</span> {{ institucion.municipio }}<br><span class='dato'>Departamento:</span> {{ institucion.departamento }}<br><span class='dato'>Dirección:</span> {{ institucion.direccion }}<br><span class='dato'>Teléfono:</span> {{ institucion.telefono }}<br><span class='dato'>Correo:</span> {{ institucion.email }}<br><span class='dato'>Licencia de Funcionamiento:</span> {{ institucion.licencia }}<br><span class='dato'>Nivel educativo:</span> {{ institucion.nivel_educativo }}</p></div><div class='section'><h2>2. Misión</h2><p>{{ mision }}</p></div><div class='section'><h2>3. Visión</h2><p>{{ vision }}</p></div><div class='section'><h2>4. Principios y Fines Institucionales</h2><p>{{ principios_fines }}</p></div><div class='section'><h2>5. Programas Registrados</h2><p>{{ programas_registrados }}</p></div><div class='section'><h2>6. Estrategia Pedagógica</h2><p>{{ estrategia_pedagogica }}</p></div><div class='section'><h2>7. Organización Administrativa</h2><p>{{ organizacion_administrativa }}</p></div><div class='section'><h2>8. Reglamento de Estudiantes y Formadores</h2><p>{{ reglamento }}</p></div><div class='section'><h2>9. Autoevaluación Institucional</h2><p>{{ autoevaluacion }}</p></div><div class='firmas'><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Representante Comunidad Educativa</strong></p></div></div><div class='footer'><p>Aprobado en {{ institucion.municipio }} a los {{ dia }} días del mes de {{ mes }} de {{ anio }}</p></div></body></html>""",
    },
    {
        "name": "Libro de Matrículas",
        "document_type": "LR002",
        "description": "Libro de Matrículas — datos del estudiante, representante legal (si aplica) y compromiso institucional.",
        "required_fields": [
            "folio",
            "numero_matricula",
            "nombre_estudiante",
            "tipo_documento",
            "documento_estudiante",
            "lugar_expedicion",
            "direccion",
            "barrio",
            "comuna",
            "telefono_estudiante",
            "nombre_programa",
            "tipo_certificado",
            "dia",
            "mes",
            "anio",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:11pt;} .header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px;} .header h1{font-size:13pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:15pt;font-weight:bold;text-transform:uppercase;margin:25px 0;} .folio{text-align:right;font-size:10pt;margin-bottom:15px;} .section{margin:20px 0;} .section h2{font-size:11pt;font-weight:bold;text-transform:uppercase;background-color:#000;color:#fff;padding:5px 8px;margin-bottom:10px;} table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10pt;} th{background-color:#ccc;padding:6px;text-align:left;border:1px solid #000;} td{border:1px solid #ccc;padding:6px;} .firmas{margin-top:40px;display:flex;justify-content:space-around;text-align:center;} .firma{width:180px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Licencia de Funcionamiento N° {{ institucion.licencia }}</p></div><div class='title'>Libro de Matrículas</div><div class='folio'>Folio: {{ folio }} | N° Matrícula: {{ numero_matricula }}</div><div class='section'><h2>Datos del Estudiante</h2><table><tr><th>Nombres y apellidos</th><td>{{ nombre_estudiante }}</td></tr><tr><th>Documento de identidad</th><td>{{ tipo_documento }} N° {{ documento_estudiante }} expedido en {{ lugar_expedicion }}</td></tr><tr><th>Dirección de residencia</th><td>{{ direccion }}</td></tr><tr><th>Barrio / Comuna</th><td>{{ barrio }} / {{ comuna }}</td></tr><tr><th>Teléfono</th><td>{{ telefono_estudiante }}</td></tr><tr><th>Programa</th><td>{{ nombre_programa }}</td></tr><tr><th>Certificado que otorga</th><td>{{ tipo_certificado }}</td></tr></table></div>{% if es_menor_edad %}<div class='section'><h2>Datos del Representante Legal</h2><table><tr><th>Nombres y apellidos</th><td>{{ nombre_representante }}</td></tr><tr><th>Documento de identidad</th><td>{{ documento_representante }}</td></tr><tr><th>Dirección</th><td>{{ direccion_representante }}</td></tr><tr><th>Teléfono</th><td>{{ telefono_representante }}</td></tr></table></div>{% endif %}<div class='section'><h2>Matrícula</h2><table><tr><th>Fecha</th><td>{{ dia }}/{{ mes }}/{{ anio }}</td></tr><tr><th>Compromiso</th><td>Los firmantes aceptamos el PEI y el reglamento de estudiantes</td></tr></table></div><div class='firmas'><div class='firma'><div class='linea'></div><p><strong>Estudiante</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Personal Administrativo</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p></div></div></body></html>""",
    },
    {
        "name": "Actas de Participación Comunitaria",
        "document_type": "LR003",
        "description": "Acta del estamento de participación comunitaria — asistencia, propósito, desarrollo y acuerdos.",
        "required_fields": [
            "nombre_estamento",
            "numero_acta",
            "lugar",
            "dia",
            "mes",
            "anio",
            "hora_inicio",
            "asistentes",
            "ausentes",
            "proposito",
            "punto_3",
            "punto_4",
            "punto_5",
            "desarrollo",
            "acuerdos",
            "hora_fin",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:11pt;} .header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px;} .header h1{font-size:13pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:25px 0;} .numero{text-align:center;font-size:12pt;margin-bottom:20px;} .info{margin:15px 0;line-height:2;} .info span{font-weight:bold;} .section{margin:20px 0;} .section h2{font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:10px;} .section p{line-height:1.8;text-align:justify;min-height:60px;} .orden-dia{margin:10px 0;} .orden-dia li{margin:5px 0;line-height:1.8;} .firmas{margin-top:60px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Licencia de Funcionamiento N° {{ institucion.licencia }}</p></div><div class='title'>Acta del {{ nombre_estamento }}</div><div class='numero'>N° {{ numero_acta }}</div><div class='info'><p><span>Lugar:</span> {{ lugar }} &nbsp;&nbsp; <span>Fecha:</span> {{ dia }}/{{ mes }}/{{ anio }} &nbsp;&nbsp; <span>Hora de inicio:</span> {{ hora_inicio }}</p></div><div class='section'><h2>Asistentes</h2><p>{{ asistentes }}</p></div><div class='section'><h2>Ausentes</h2><p>{{ ausentes }}</p></div><div class='section'><h2>Propósito de la Reunión</h2><p>{{ proposito }}</p></div><div class='section'><h2>Orden del Día</h2><ol class='orden-dia'><li>Verificación del quórum</li><li>Lectura y aprobación del acta anterior</li><li>{{ punto_3 }}</li><li>{{ punto_4 }}</li><li>{{ punto_5 }}</li></ol></div><div class='section'><h2>Desarrollo</h2><p>{{ desarrollo }}</p></div><div class='section'><h2>Propuestas, Sugerencias y Acuerdos</h2><p>{{ acuerdos }}</p></div><div class='info'><p><span>Hora de finalización:</span> {{ hora_fin }}</p></div><div class='firmas'><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Secretario(a) del Estamento</strong></p></div></div></body></html>""",
    },
    {
        "name": "Actas Pedagógicas y Disciplinarias",
        "document_type": "LR004",
        "description": "Acta del Estamento Pedagógico, Académico y Disciplinario — asistencia, propósito, desarrollo y compromisos.",
        "required_fields": [
            "numero_acta",
            "lugar",
            "dia",
            "mes",
            "anio",
            "hora_inicio",
            "asistentes",
            "ausentes",
            "proposito",
            "punto_3",
            "punto_4",
            "punto_5",
            "desarrollo",
            "compromisos",
            "hora_fin",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:11pt;} .header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px;} .header h1{font-size:13pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:25px 0;} .numero{text-align:center;font-size:12pt;margin-bottom:20px;} .info{margin:15px 0;line-height:2;} .info span{font-weight:bold;} .section{margin:20px 0;} .section h2{font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:10px;} .section p{line-height:1.8;text-align:justify;min-height:60px;} .orden-dia li{margin:5px 0;line-height:1.8;} .firmas{margin-top:60px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Licencia de Funcionamiento N° {{ institucion.licencia }}</p></div><div class='title'>Acta del Estamento Pedagógico, Académico y Disciplinario</div><div class='numero'>N° {{ numero_acta }}</div><div class='info'><p><span>Lugar:</span> {{ lugar }} &nbsp;&nbsp; <span>Fecha:</span> {{ dia }}/{{ mes }}/{{ anio }} &nbsp;&nbsp; <span>Hora de inicio:</span> {{ hora_inicio }}</p></div><div class='section'><h2>Asistentes</h2><p>{{ asistentes }}</p></div><div class='section'><h2>Ausentes</h2><p>{{ ausentes }}</p></div><div class='section'><h2>Propósito de la Reunión</h2><p>{{ proposito }}</p></div><div class='section'><h2>Orden del Día</h2><ol class='orden-dia'><li>Verificación del quórum</li><li>Lectura y aprobación del acta anterior</li><li>{{ punto_3 }}</li><li>{{ punto_4 }}</li><li>{{ punto_5 }}</li></ol></div><div class='section'><h2>Desarrollo</h2><p>{{ desarrollo }}</p></div><div class='section'><h2>Propuestas, Sugerencias, Recomendaciones y Compromisos</h2><p>{{ compromisos }}</p></div><div class='info'><p><span>Hora de finalización:</span> {{ hora_fin }}</p></div><div class='firmas'><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Secretario(a) del Estamento</strong></p></div></div></body></html>""",
    },
    {
        "name": "Registro de Certificados de Aptitud",
        "document_type": "LR005",
        "description": "Registro de Certificados de Aptitud Ocupacional otorgados — libro consolidado por institución.",
        "required_fields": [
            "filas_certificados",
            "total_estudiantes",
            "primer_nombre",
            "ultimo_nombre",
            "dia",
            "mes",
            "anio",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:10pt;} .header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px;} .header h1{font-size:13pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:25px 0;} .intro{font-size:10pt;text-align:justify;margin:15px 0;line-height:1.6;} table{width:100%;border-collapse:collapse;margin:20px 0;font-size:9pt;} th{background-color:#000;color:#fff;padding:6px;text-align:left;border:1px solid #000;} td{border:1px solid #ccc;padding:6px;min-height:30px;} .resumen{margin:20px 0;font-size:10pt;line-height:1.8;} .firmas{margin-top:60px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Licencia de Funcionamiento N° {{ institucion.licencia }}</p></div><div class='title'>Registro de Certificados de Aptitud Ocupacional</div><div class='intro'>Verificada la situación legal y académica de cada uno de los alumnos que cursaron y aprobaron los estudios correspondientes al programa de educación para el trabajo y el desarrollo humano y confrontar que cumplieron con los requisitos establecidos en la ley y en el proyecto educativo institucional, se procedió a otorgar el certificado de aptitud ocupacional a los estudiantes que se registran a continuación:</div><table><tr><th>N° Orden</th><th>Fecha</th><th>Nombre completo</th><th>Documento de identidad</th><th>Certificado otorgado</th><th>Horas del programa</th><th>Firma de quien recibe</th></tr>{{ filas_certificados }}</table><div class='resumen'><p>El presente registro de certificación consta de <strong>{{ total_estudiantes }}</strong> alumnos, comienza con el nombre de <strong>{{ primer_nombre }}</strong> y termina con el nombre de <strong>{{ ultimo_nombre }}</strong>.</p></div><div class='firmas'><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Secretario(a)</strong></p></div></div><p style='text-align:center;margin-top:20px;font-size:10pt;'>Para constancia, se firma en {{ institucion.municipio }} a los {{ dia }} días del mes de {{ mes }} de {{ anio }}</p></body></html>""",
    },
    {
        "name": "Autoevaluación Institucional",
        "document_type": "LR006",
        "description": "Registro de Autoevaluación Institucional — resultados, fortalezas, debilidades y plan de mejoramiento.",
        "required_fields": [
            "periodo",
            "anio",
            "resultados_autoevaluacion",
            "fortalezas",
            "debilidades",
            "filas_plan_mejoramiento",
            "seguimiento_plan",
            "dia",
            "mes",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:11pt;} .header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px;} .header h1{font-size:13pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:25px 0;} .periodo{text-align:center;font-size:11pt;margin-bottom:20px;} .section{margin:20px 0;} .section h2{font-size:11pt;font-weight:bold;text-transform:uppercase;background-color:#000;color:#fff;padding:5px 8px;margin-bottom:10px;} .section p{line-height:1.8;text-align:justify;min-height:80px;} table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10pt;} th{background-color:#ccc;padding:6px;text-align:left;border:1px solid #000;} td{border:1px solid #ccc;padding:6px;} .firma{margin-top:60px;text-align:center;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;width:250px;margin:0 auto 5px auto;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Licencia de Funcionamiento N° {{ institucion.licencia }}</p></div><div class='title'>Registro de Autoevaluación Institucional</div><div class='periodo'>Período: {{ periodo }} — Año: {{ anio }}</div><div class='section'><h2>1. Resultados de la Autoevaluación</h2><p>{{ resultados_autoevaluacion }}</p></div><div class='section'><h2>2. Fortalezas Identificadas</h2><p>{{ fortalezas }}</p></div><div class='section'><h2>3. Debilidades Identificadas</h2><p>{{ debilidades }}</p></div><div class='section'><h2>4. Plan de Mejoramiento</h2><table><tr><th>Aspecto a mejorar</th><th>Estrategia</th><th>Responsable</th><th>Fecha límite</th></tr>{{ filas_plan_mejoramiento }}</table></div><div class='section'><h2>5. Seguimiento a Plan de Mejoramiento Anterior</h2><p>{{ seguimiento_plan }}</p></div><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p><p>Responsable del proceso de autoevaluación</p></div><p style='text-align:center;margin-top:20px;font-size:10pt;'>{{ institucion.municipio }}, {{ dia }} de {{ mes }} de {{ anio }}</p></body></html>""",
    },
    {
        "name": "Reconocimiento de Saberes Previos",
        "document_type": "LR007",
        "description": "Registro de Reconocimiento de Saberes Previos — valoración de conocimientos y experiencias previas del estudiante.",
        "required_fields": [
            "folio",
            "nombre_estudiante",
            "tipo_documento",
            "documento_estudiante",
            "nombre_programa",
            "dia",
            "mes",
            "anio",
            "filas_modulos",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:11pt;} .header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px;} .header h1{font-size:13pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:25px 0;} .folio{text-align:right;font-size:10pt;margin-bottom:15px;} .datos{margin:15px 0;line-height:2;} .datos span{font-weight:bold;} table{width:100%;border-collapse:collapse;margin:20px 0;font-size:10pt;} th{background-color:#000;color:#fff;padding:6px;text-align:left;border:1px solid #000;} td{border:1px solid #ccc;padding:6px;} .nota{font-size:10pt;font-style:italic;text-align:justify;margin:15px 0;border:1px solid #ccc;padding:10px;} .firmas{margin-top:60px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Licencia de Funcionamiento N° {{ institucion.licencia }}</p></div><div class='title'>Reconocimiento de Saberes Previos</div><div class='folio'>Folio: {{ folio }}</div><div class='datos'><p><span>Nombre del alumno:</span> {{ nombre_estudiante }}</p><p><span>Documento de identidad:</span> {{ tipo_documento }} N° {{ documento_estudiante }}</p><p><span>Programa:</span> {{ nombre_programa }}</p><p><span>Fecha:</span> {{ dia }}/{{ mes }}/{{ anio }}</p></div><table><tr><th>Módulo</th><th>Docente Responsable</th><th>Valoración</th><th>Aprobó (Sí/No)</th></tr>{{ filas_modulos }}</table><div class='nota'>El mecanismo de valoración de conocimientos, experiencias y prácticas previamente adquiridas por los estudiantes está contenido en el Proyecto Educativo Institucional (PEI) del establecimiento educativo, conforme al numeral 2.6.4.15 del Decreto 1075 de 2015.</div><div class='firmas'><div class='firma'><div class='linea'></div><p><strong>Docente Responsable</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p></div></div></body></html>""",
    },
    {
        "name": "Registro de Calificaciones Definitivas",
        "document_type": "LR008",
        "description": "Registro de calificaciones por módulo, actividades de recuperación y estado de aprobación del estudiante.",
        "required_fields": [
            "folio",
            "codigo_matricula",
            "nombre_estudiante",
            "documento_estudiante",
            "numero_matricula",
            "nombre_programa",
            "anio",
            "filas_calificaciones",
            "filas_recuperacion",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:11pt;} .header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px;} .header h1{font-size:13pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:25px 0;} .folio{text-align:right;font-size:10pt;margin-bottom:15px;} .datos{margin:15px 0;} table{width:100%;border-collapse:collapse;margin:20px 0;font-size:10pt;} th{background-color:#000;color:#fff;padding:6px;text-align:left;border:1px solid #000;} td{border:1px solid #ccc;padding:6px;} .section-title{font-size:11pt;font-weight:bold;text-transform:uppercase;margin:20px 0 10px 0;border-bottom:1px solid #000;padding-bottom:4px;} .firmas{margin-top:60px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Licencia de Funcionamiento N° {{ institucion.licencia }}</p></div><div class='title'>Registro de Calificaciones Definitivas</div><div class='folio'>Folio: {{ folio }} | Código matrícula: {{ codigo_matricula }}</div><div class='datos'><p><strong>Nombre del alumno:</strong> {{ nombre_estudiante }} &nbsp;&nbsp; <strong>Documento:</strong> {{ documento_estudiante }}</p><p><strong>N° de matrícula:</strong> {{ numero_matricula }} &nbsp;&nbsp; <strong>Programa:</strong> {{ nombre_programa }} &nbsp;&nbsp; <strong>Año:</strong> {{ anio }}</p></div><div class='section-title'>Calificaciones por Módulo</div><table><tr><th>Módulo</th><th>Valoración</th><th>Aprobó (Sí/No)</th><th>Intensidad (horas)</th></tr>{{ filas_calificaciones }}</table><div class='section-title'>Actividades de Recuperación, Habilitación o Refuerzo</div><table><tr><th>Módulo</th><th>Valoración</th><th>Aprobó (Sí/No)</th><th>Fecha</th></tr>{{ filas_recuperacion }}</table><div class='firmas'><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Secretario(a)</strong></p></div></div></body></html>""",
    },
    {
        "name": "Registros Especiales (Duplicados)",
        "document_type": "LR009",
        "description": "Libro de Registros Especiales — para duplicados o modificaciones de certificados ya emitidos.",
        "required_fields": [
            "tipo_registro",
            "nombre_estudiante",
            "documento_estudiante",
            "numero_libro",
            "folio",
            "numero_registro",
            "observaciones",
            "dia",
            "mes",
            "anio",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:11pt;} .header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px;} .header h1{font-size:13pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:25px 0;} .tipo{text-align:center;font-size:12pt;font-weight:bold;border:2px solid #000;padding:8px;margin:15px auto;width:300px;} .datos{margin:20px 0;} table{width:100%;border-collapse:collapse;margin:20px 0;font-size:10pt;} th{background-color:#000;color:#fff;padding:6px;text-align:left;border:1px solid #000;} td{border:1px solid #ccc;padding:6px;} .observaciones{margin:20px 0;} .observaciones h2{font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:10px;} .observaciones p{min-height:100px;line-height:1.8;text-align:justify;border:1px solid #ccc;padding:10px;} .firmas{margin-top:60px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Licencia de Funcionamiento N° {{ institucion.licencia }}</p></div><div class='title'>Libro de Registros Especiales</div><div class='tipo'>Tipo de Registro: {{ tipo_registro }}</div><table><tr><th>Nombre completo</th><td>{{ nombre_estudiante }}</td></tr><tr><th>Documento de identidad</th><td>{{ documento_estudiante }}</td></tr><tr><th>Certificado registrado en</th><td>Libro N° {{ numero_libro }}, Folio {{ folio }}, Registro inicial N° {{ numero_registro }}</td></tr></table><div class='observaciones'><h2>Observaciones</h2><p>{{ observaciones }}</p></div><div class='firmas'><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Titular del Certificado</strong></p></div></div><p style='text-align:center;margin-top:20px;font-size:10pt;'>Para constancia, se firma en {{ institucion.municipio }} a los {{ dia }} días del mes de {{ mes }} de {{ anio }}</p></body></html>""",
    },
    {
        "name": "Certificado de Aptitud Ocupacional — Laboral",
        "document_type": "certificado_aptitud_laboral",
        "description": "Certificado de Aptitud Ocupacional por Competencias — programas de formación laboral.",
        "required_fields": [
            "nombre_estudiante",
            "documento_estudiante",
            "lugar_expedicion",
            "nombre_programa",
            "total_horas",
            "resolucion_programa",
            "numero_libro",
            "folio",
            "fecha_registro",
            "dia",
            "mes",
            "anio",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:12pt;} .header{text-align:center;margin-bottom:40px;border-bottom:2px solid #000;padding-bottom:20px;} .header h1{font-size:13pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:13pt;font-weight:bold;text-transform:uppercase;margin:40px 0 10px 0;letter-spacing:1px;} .subtitle{text-align:center;font-size:15pt;font-weight:bold;text-transform:uppercase;margin:10px 0 30px 0;letter-spacing:2px;border:2px solid #000;padding:10px;} .content{line-height:2;text-align:center;margin:20px 0;} .nombre{font-size:16pt;font-weight:bold;text-transform:uppercase;margin:20px 0;text-decoration:underline;} .dato{font-weight:bold;} .legal{font-size:10pt;text-align:justify;margin:20px 0;line-height:1.5;} .firmas{margin-top:80px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;} .footer{margin-top:20px;font-size:10pt;text-align:center;} .registro{font-size:10pt;text-align:center;margin:20px 0;border:1px solid #000;padding:8px;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Con Licencia de Funcionamiento según Resolución N° {{ institucion.licencia }}</p><p>Registro de Programas según Resolución N° {{ resolucion_programa }}</p><p>Secretaría de Educación del Municipio de Medellín</p></div><div class='title'>Confiere el Certificado de Aptitud Ocupacional por Competencias</div><div class='subtitle'>Técnico Laboral en<br>{{ nombre_programa }}</div><div class='content'><p>Por <span class='dato'>{{ total_horas }} horas</span></p><p>A</p><p class='nombre'>{{ nombre_estudiante }}</p><p>Con Documento de Identidad N° <span class='dato'>{{ documento_estudiante }}</span> de <span class='dato'>{{ lugar_expedicion }}</span></p><p class='legal'>Por haber cumplido con los requisitos legales establecidos en el Decreto Nacional 1075 de mayo 26 de 2015 y el plan de estudios conforme al Proyecto Educativo Institucional.</p></div><div class='registro'>Registrado en el Libro de Certificados Número <span class='dato'>{{ numero_libro }}</span>, Folio <span class='dato'>{{ folio }}</span> de {{ fecha_registro }}</div><div class='firmas'><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Secretaria Académica</strong></p></div></div><div class='footer'><p>Dado en {{ institucion.municipio }} a los {{ dia }} días del mes de {{ mes }} de {{ anio }}</p></div></body></html>""",
    },
    {
        "name": "Certificado de Aptitud Ocupacional — Salud",
        "document_type": "certificado_aptitud_salud",
        "description": "Certificado de Aptitud Ocupacional por Competencias — programas del área de salud, incluye nota RETHUS.",
        "required_fields": [
            "nombre_estudiante",
            "documento_estudiante",
            "lugar_expedicion",
            "nombre_programa",
            "total_horas",
            "resolucion_programa",
            "numero_libro",
            "folio",
            "fecha_registro",
            "dia",
            "mes",
            "anio",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:12pt;} .header{text-align:center;margin-bottom:40px;border-bottom:2px solid #000;padding-bottom:20px;} .header h1{font-size:13pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:13pt;font-weight:bold;text-transform:uppercase;margin:40px 0 10px 0;letter-spacing:1px;} .subtitle{text-align:center;font-size:15pt;font-weight:bold;text-transform:uppercase;margin:10px 0 30px 0;letter-spacing:2px;border:2px solid #000;padding:10px;} .content{line-height:2;text-align:center;margin:20px 0;} .nombre{font-size:16pt;font-weight:bold;text-transform:uppercase;margin:20px 0;text-decoration:underline;} .dato{font-weight:bold;} .legal{font-size:10pt;text-align:justify;margin:20px 0;line-height:1.5;} .rethus{font-size:10pt;text-align:justify;margin:10px 0;line-height:1.5;font-style:italic;border:1px solid #000;padding:8px;} .firmas{margin-top:80px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;} .footer{margin-top:20px;font-size:10pt;text-align:center;} .registro{font-size:10pt;text-align:center;margin:20px 0;border:1px solid #000;padding:8px;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Con Licencia de Funcionamiento según Resolución N° {{ institucion.licencia }}</p><p>Registro de Programas según Resolución N° {{ resolucion_programa }}</p><p>Secretaría de Educación del Municipio de Medellín</p></div><div class='title'>Confiere el Certificado de Aptitud Ocupacional por Competencias</div><div class='subtitle'>Técnico Laboral en<br>{{ nombre_programa }}</div><div class='content'><p>Por <span class='dato'>{{ total_horas }} horas</span></p><p>A</p><p class='nombre'>{{ nombre_estudiante }}</p><p>Con Documento de Identidad N° <span class='dato'>{{ documento_estudiante }}</span> de <span class='dato'>{{ lugar_expedicion }}</span></p><p class='legal'>Por haber cumplido con los requisitos legales establecidos en el Decreto Nacional 1075 de mayo 26 de 2015 y el plan de estudios conforme al Proyecto Educativo Institucional.</p></div><div class='rethus'>Nota: Para la plena validez de este certificado, el titular debe solicitar su inscripción en el Registro Único Nacional de Talento Humano en Salud – RETHUS, conforme al parágrafo 1° del numeral 6.3 del Decreto 4904 de 2009 y la Ley 1164 de 2007.</div><div class='registro'>Registrado en el Libro de Certificados Número <span class='dato'>{{ numero_libro }}</span>, Folio <span class='dato'>{{ folio }}</span> de {{ fecha_registro }}</div><div class='firmas'><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Secretaria Académica</strong></p></div></div><div class='footer'><p>Dado en {{ institucion.municipio }} a los {{ dia }} días del mes de {{ mes }} de {{ anio }}</p></div></body></html>""",
    },
    {
        "name": "Certificado de Conocimientos Académicos",
        "document_type": "certificado_conocimientos",
        "description": "Certifica que el estudiante culminó y aprobó satisfactoriamente el programa académico.",
        "required_fields": [
            "nombre_estudiante",
            "documento_estudiante",
            "lugar_expedicion",
            "nombre_programa",
            "total_horas",
            "resolucion_programa",
            "numero_libro",
            "folio",
            "fecha_registro",
            "dia",
            "mes",
            "anio",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:12pt;} .header{text-align:center;margin-bottom:40px;border-bottom:2px solid #000;padding-bottom:20px;} .header h1{font-size:13pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:10pt;} .title{text-align:center;font-size:13pt;font-weight:bold;text-transform:uppercase;margin:40px 0 10px 0;letter-spacing:1px;} .subtitle{text-align:center;font-size:15pt;font-weight:bold;text-transform:uppercase;margin:10px 0 30px 0;letter-spacing:2px;border:2px solid #000;padding:10px;} .content{line-height:2;text-align:center;margin:20px 0;} .nombre{font-size:16pt;font-weight:bold;text-transform:uppercase;margin:20px 0;text-decoration:underline;} .dato{font-weight:bold;} .legal{font-size:10pt;text-align:justify;margin:20px 0;line-height:1.5;} .firmas{margin-top:80px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;} .footer{margin-top:20px;font-size:10pt;text-align:center;} .registro{font-size:10pt;text-align:center;margin:20px 0;border:1px solid #000;padding:8px;}</style></head><body>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<div class='header'><h1>{{ institucion.nombre }}</h1><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Con Licencia de Funcionamiento según Resolución N° {{ institucion.licencia }}</p><p>Registro de Programas según Resolución N° {{ resolucion_programa }}</p><p>Secretaría de Educación del Municipio de Medellín</p></div><div class='title'>Certifica que</div><div class='content'><p class='nombre'>{{ nombre_estudiante }}</p><p>Con Documento de Identidad N° <span class='dato'>{{ documento_estudiante }}</span> de <span class='dato'>{{ lugar_expedicion }}</span></p><p>Ha culminado y aprobado satisfactoriamente el programa</p></div><div class='subtitle'>{{ nombre_programa }}</div><div class='content'><p>Con una intensidad horaria de <span class='dato'>{{ total_horas }} horas</span></p><p class='legal'>Por haber cumplido con los requisitos académicos establecidos en el Decreto Nacional 1075 de mayo 26 de 2015 y el plan de estudios conforme al Proyecto Educativo Institucional, demostrando los conocimientos y competencias requeridas.</p></div><div class='registro'>Registrado en el Libro de Certificados Número <span class='dato'>{{ numero_libro }}</span>, Folio <span class='dato'>{{ folio }}</span> de {{ fecha_registro }}</div><div class='firmas'><div class='firma'><div class='linea'></div><p><strong>Rector / Director</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Secretaria Académica</strong></p></div></div><div class='footer'><p>Dado en {{ institucion.municipio }} a los {{ dia }} días del mes de {{ mes }} de {{ anio }}</p></div></body></html>""",
    },
    {
        "name": "Constancia de Asistencia",
        "document_type": "constancia_asistencia",
        "description": "Constancia de asistencia a curso de educación informal — no otorga certificación de aptitud.",
        "required_fields": [
            "nombre_curso",
            "duracion_horas",
            "nombre_estudiante",
            "documento_estudiante",
            "lugar_expedicion",
            "dia",
            "mes",
            "anio",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:12pt;} .header{text-align:center;margin-bottom:40px;border-bottom:2px solid #000;padding-bottom:20px;} .header h1{font-size:14pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:11pt;} .title{text-align:center;font-size:16pt;font-weight:bold;text-transform:uppercase;margin:40px 0 30px 0;letter-spacing:2px;} .content{line-height:2;text-align:justify;margin:20px 0;} .content p{margin:15px 0;} .dato{font-weight:bold;text-decoration:underline;} .firmas{margin-top:80px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;} .footer{margin-top:40px;font-size:10pt;text-align:center;font-style:italic;}</style></head><body><div class='header'>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<h1>República de Colombia</h1><h1>Departamento de Antioquia</h1><h1>{{ institucion.nombre }}</h1><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Licencia de Funcionamiento N° {{ institucion.licencia }}</p></div><div class='title'>Constancia de Asistencia</div><div class='content'><p>La <span class='dato'>{{ institucion.nombre }}</span>, institución de Educación para el Trabajo y el Desarrollo Humano, con domicilio en <span class='dato'>{{ institucion.municipio }}, {{ institucion.departamento }}</span>,</p><p><strong>ENTREGA CONSTANCIA DE ASISTENCIA</strong></p><p>Al curso de <span class='dato'>{{ nombre_curso }}</span>, con una duración de <span class='dato'>{{ duracion_horas }} horas</span>, a:</p><p style='text-align:center;font-size:14pt;font-weight:bold;'>{{ nombre_estudiante }}</p><p style='text-align:center;'>Con documento de identidad N° <span class='dato'>{{ documento_estudiante }}</span> expedido en <span class='dato'>{{ lugar_expedicion }}</span></p><p>Se expide de conformidad con lo establecido en el Artículo 2.6.6.8 del Decreto 1075 de 2015 de educación informal.</p></div><div class='firmas'><div class='firma'><div class='linea'></div><p>{{ institucion.nombre }}</p><p><strong>Representante Legal</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Secretaria Académica</strong></p></div></div><div class='footer'><p>Dado en {{ institucion.municipio }} a los {{ dia }} días del mes de {{ mes }} de {{ anio }}</p></div></body></html>""",
    },
    {
        "name": "Constancia o Certificado de Estudio",
        "document_type": "constancia_estudio",
        "description": "Certifica que el estudiante se encuentra actualmente matriculado y cursando un programa.",
        "required_fields": [
            "nombre_estudiante",
            "documento_estudiante",
            "lugar_expedicion",
            "nombre_programa",
            "total_horas",
            "numero_matricula",
            "dia",
            "mes",
            "anio",
        ],
        "template_html": """<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;margin:60px;font-size:12pt;} .header{text-align:center;margin-bottom:40px;border-bottom:2px solid #000;padding-bottom:20px;} .header h1{font-size:14pt;font-weight:bold;text-transform:uppercase;margin:5px 0;} .header p{margin:3px 0;font-size:11pt;} .title{text-align:center;font-size:16pt;font-weight:bold;text-transform:uppercase;margin:40px 0 30px 0;letter-spacing:2px;} .content{line-height:2;text-align:justify;margin:20px 0;} .content p{margin:15px 0;} .dato{font-weight:bold;text-decoration:underline;} .firmas{margin-top:80px;display:flex;justify-content:space-around;text-align:center;} .firma{width:200px;} .firma .linea{border-top:1px solid #000;margin-bottom:5px;} .footer{margin-top:40px;font-size:10pt;text-align:center;font-style:italic;}</style></head><body><div class='header'>{% if institucion.logo_url %}<div style="text-align: {{ institucion.logo_align | default('left') }}; margin-bottom: 15px;"><img src="{{ institucion.logo_url }}" style="max-height: 80px; max-width: 200px; display: inline-block;" /></div>{% endif %}<h1>{{ institucion.nombre }}</h1><p>Institución de Educación para el Trabajo y el Desarrollo Humano</p><p>Licencia de Funcionamiento N° {{ institucion.licencia }}</p></div><div class='title'>Constancia de Estudio</div><div class='content'><p>La <span class='dato'>{{ institucion.nombre }}</span>, institución de Educación para el Trabajo y el Desarrollo Humano, con domicilio en <span class='dato'>{{ institucion.municipio }}, {{ institucion.departamento }}</span>,</p><p><strong>HACE CONSTAR QUE</strong></p><p style='text-align:center;font-size:14pt;font-weight:bold;'>{{ nombre_estudiante }}</p><p style='text-align:center;'>Con documento de identidad N° <span class='dato'>{{ documento_estudiante }}</span> expedido en <span class='dato'>{{ lugar_expedicion }}</span></p><p>Se encuentra actualmente matriculado(a) y cursando el programa de <span class='dato'>{{ nombre_programa }}</span>, con una intensidad horaria total de <span class='dato'>{{ total_horas }} horas</span>, con matrícula N° <span class='dato'>{{ numero_matricula }}</span>.</p><p>La presente constancia se expide a solicitud del interesado para los fines que estime convenientes.</p></div><div class='firmas'><div class='firma'><div class='linea'></div><p>{{ institucion.nombre }}</p><p><strong>Representante Legal</strong></p></div><div class='firma'><div class='linea'></div><p><strong>Secretaria Académica</strong></p></div></div><div class='footer'><p>Dado en {{ institucion.municipio }} a los {{ dia }} días del mes de {{ mes }} de {{ anio }}</p></div></body></html>""",
    },
]


def seed():
    db = SessionLocal()
    created = 0
    skipped = 0
    for t in TEMPLATES:
        existing = (
            db.query(DocumentTemplate)
            .filter(DocumentTemplate.document_type == DocumentType(t["document_type"]))
            .first()
        )
        if existing:
            print(f"Ya existe: {t['name']} ({t['document_type']}) — omitida")
            skipped += 1
            continue
        template = DocumentTemplate(
            name=t["name"],
            document_type=DocumentType(t["document_type"]),
            description=t["description"],
            required_fields=t["required_fields"],
            template_html=t["template_html"],
        )
        db.add(template)
        created += 1
        print(f"Creada: {t['name']} ({t['document_type']})")
    db.commit()
    db.close()
    print(f"\nListo. {created} plantillas creadas, {skipped} omitidas (ya existían).")


if __name__ == "__main__":
    seed()

// Convierte el JSON de Tiptap (editor.getJSON()) en el template_html + required_fields
// que espera el backend. No depende de React ni de Tiptap directamente — solo
// recibe un objeto plano y devuelve strings.

// Encabezado institucional + hoja de estilos compartida.
// IMPORTANTE: mantener idéntico a BASE_HEAD en backend/seed_templates.py,
// así las plantillas sembradas y las guardadas desde el editor se ven igual.
const HEADER_AND_STYLES = `<!DOCTYPE html><html><head><meta charset='utf-8'><style>
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
</div>`;

const FOOTER = `</body></html>`;

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Envuelve HTML ya escapado con las marcas de formato (negrita, cursiva, subrayado)
function wrapMarks(html, marks = []) {
    let result = html;
    for (const mark of marks) {
        if (mark.type === "bold") result = `<strong>${result}</strong>`;
        if (mark.type === "italic") result = `<em>${result}</em>`;
        if (mark.type === "underline") result = `<u>${result}</u>`;
    }
    return result;
}

function applyMarks(text, marks = []) {
    return wrapMarks(escapeHtml(text), marks);
}

// Convierte el contenido inline de un nodo (texto + chips de variable)
// en HTML, y recolecta las variables usadas en el array requiredFields.
function compileInline(content = [], requiredFields) {
    return content
        .map((node) => {
            if (node.type === "text") {
                return applyMarks(node.text, node.marks);
            }
            if (node.type === "variableChip") {
                const key = node.attrs?.jinjaKey;
                if (key) {
                    // Solo se agrega a required_fields si NO es un dato institucional
                    // (institucion.nombre, etc. ya llega solo, no depende del usuario)
                    if (!key.startsWith("institucion.")) {
                        requiredFields.add(key);
                    }
                    // Los chips también pueden ir en negrita (ej. el nombre en un certificado)
                    return wrapMarks(`{{ ${key} }}`, node.marks);
                }
            }
            return "";
        })
        .join("");
}

function paragraphStyle(attrs = {}) {
    const styles = [];
    if (attrs.textAlign && attrs.textAlign !== "left") {
        styles.push(`text-align:${attrs.textAlign}`);
    }
    const lineHeights = { compact: "1.0", normal: "1.5", relaxed: "2.0" };
    if (attrs.lineHeight && attrs.lineHeight !== "normal") {
        styles.push(`line-height:${lineHeights[attrs.lineHeight]}`);
    }
    return styles.length ? ` style="${styles.join(";")}"` : "";
}

let tableCounter = 0;

// Recorre los nodos de nivel de bloque (párrafos, encabezados, tablas, listas)
function compileBlocks(nodes = [], requiredFields, tableColumns) {
    return nodes
        .map((node) => {
            switch (node.type) {
                case "paragraph": {
                    const inner = compileInline(node.content, requiredFields);
                    // Descarta párrafos completamente vacíos (el "<p></p> fantasma"
                    // que a veces deja el editor) — no aportan nada al documento final.
                    if (!inner.trim()) return "";
                    return `<p${paragraphStyle(node.attrs)}>${inner}</p>`;
                }

                case "sectionHeading": {
                    const level = node.attrs?.level || 2;
                    const text = escapeHtml(node.attrs?.text || "");
                    if (!text.trim()) return "";
                    return `<div class="section"><h${level}>${text}</h${level}></div>`;
                }

                case "dynamicTable": {
                    tableCounter += 1;
                    const varName = `filas_datos_${tableCounter}`;
                    const columns = node.attrs?.columns || [];
                    const headerRow = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
                    requiredFields.add(varName);
                    tableColumns[varName] = columns;
                    return `<table><tr>${headerRow}</tr>{{ ${varName} }}</table>`;
                }

                case "dataTable": {
                    const rows = node.attrs?.rows || [];
                    const rowsHtml = rows
                        .filter((row) => row.jinjaKey) // una fila sin variable generaría {{  }} inválido
                        .map((row) => {
                            if (row.jinjaKey && !row.jinjaKey.startsWith("institucion.")) {
                                requiredFields.add(row.jinjaKey);
                            }
                            return `<tr><th>${escapeHtml(row.label)}</th><td>{{ ${row.jinjaKey} }}</td></tr>`;
                        })
                        .join("");
                    if (!rowsHtml) return "";
                    return `<table>${rowsHtml}</table>`;
                }

                case "signatureBlock": {
                    const labels = node.attrs?.labels || [];
                    const signaturesHtml = labels
                        .map(
                            (label) =>
                                `<div class="firma"><div class="linea"></div><p><strong>${escapeHtml(label)}</strong></p></div>`,
                        )
                        .join("");
                    return `<div class="firmas">${signaturesHtml}</div>`;
                }

                case "bulletList": {
                    const items = compileListItems(node.content, requiredFields);
                    return `<ul>${items}</ul>`;
                }

                case "orderedList": {
                    const items = compileListItems(node.content, requiredFields);
                    return `<ol>${items}</ol>`;
                }

                case "conditionalSection": {
                    const condition = node.attrs?.conditionVar?.trim();
                    // Si no se definió ninguna variable de condición, no tiene sentido
                    // generar un {% if %} vacío o roto — se descarta el bloque entero.
                    if (!condition) return "";

                    requiredFields.add(condition);

                    // Llamada recursiva: compila el contenido interno (párrafos, tablas,
                    // encabezados, lo que sea que el superadmin haya puesto adentro) con
                    // la misma función, antes de envolverlo en el {% if %}.
                    const innerHtml = compileBlocks(node.content, requiredFields, tableColumns);

                    return `{% if ${condition} %}\n<div class="section">${innerHtml}</div>\n{% endif %}`;
                }

                default:
                    return "";
            }
        })
        .join("\n");
}

function compileListItems(items = [], requiredFields) {
    return items
        .map((item) => {
            // Cada listItem envuelve normalmente un paragraph adentro
            const paragraphs = (item.content || [])
                .map((p) => compileInline(p.content, requiredFields))
                .join(" ");
            return `<li>${paragraphs}</li>`;
        })
        .join("");
}

/**
 * Punto de entrada del compilador.
 * @param {object} editorJSON - resultado de editor.getJSON()
 * @returns {{ template_html: string, required_fields: string[] }}
 */
export function compileTemplate(editorJSON) {
    tableCounter = 0;
    const requiredFields = new Set();
    const tableColumns = {};

    const bodyHtml = compileBlocks(editorJSON?.content, requiredFields, tableColumns);

    const template_html = `${HEADER_AND_STYLES}<div class="section">${bodyHtml}</div>${FOOTER}`;

    return {
        template_html,
        required_fields: Array.from(requiredFields),
        table_columns: tableColumns,
    };
}
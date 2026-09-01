// Convierte el JSON de Tiptap (editor.getJSON()) en el template_html + required_fields
// que espera el backend. No depende de React ni de Tiptap directamente — solo
// recibe un objeto plano y devuelve strings.

const HEADER_AND_STYLES = `<!DOCTYPE html><html><head><meta charset='utf-8'><style>
body{font-family:Arial,sans-serif;margin:60px;font-size:11pt;}
.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px;}
.header p{margin:3px 0;font-size:10pt;}
.title{text-align:center;font-size:15pt;font-weight:bold;text-transform:uppercase;margin:25px 0;}
.section{margin:20px 0;}
.section h1{font-size:14pt;font-weight:bold;margin:20px 0 10px;}
.section h2{font-size:12pt;font-weight:bold;text-transform:uppercase;margin:20px 0 10px;}
.section h3{font-size:11pt;font-weight:bold;margin:15px 0 8px;}
.section h4{font-size:10pt;font-weight:bold;text-transform:uppercase;margin:12px 0 6px;}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10pt;}
th{background-color:#ccc;padding:6px;text-align:left;border:1px solid #000;}
td{border:1px solid #ccc;padding:6px;}
ul,ol{margin:8px 0;padding-left:24px;}
</style></head><body>
{% if institucion.logo_url %}<div style="text-align:{{ institucion.logo_align|default('left') }};margin-bottom:15px;"><img src="{{ institucion.logo_url }}" style="max-height:80px;max-width:200px;" /></div>{% endif %}
<div class='header'>
<p>Institución de Educación para el Trabajo y el Desarrollo Humano</p>
<p>Licencia de Funcionamiento N° {{ institucion.licencia }}</p>
</div>`;

const FOOTER = `</body></html>`;

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Envuelve un texto con las marcas de formato (negrita, cursiva, subrayado)
function applyMarks(text, marks = []) {
    let result = escapeHtml(text);
    for (const mark of marks) {
        if (mark.type === "bold") result = `<strong>${result}</strong>`;
        if (mark.type === "italic") result = `<em>${result}</em>`;
        if (mark.type === "underline") result = `<u>${result}</u>`;
    }
    return result;
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
                    return `{{ ${key} }}`;
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
function compileBlocks(nodes = [], requiredFields) {
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
                    return `<table><tr>${headerRow}</tr>{{ ${varName} }}</table>`;
                }

                case "bulletList": {
                    const items = compileListItems(node.content, requiredFields);
                    return `<ul>${items}</ul>`;
                }

                case "orderedList": {
                    const items = compileListItems(node.content, requiredFields);
                    return `<ol>${items}</ol>`;
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
    tableCounter = 0; // reinicia el contador en cada compilación
    const requiredFields = new Set();

    const bodyHtml = compileBlocks(editorJSON?.content, requiredFields);

    const template_html = `${HEADER_AND_STYLES}<div class="section">${bodyHtml}</div>${FOOTER}`;

    return {
        template_html,
        required_fields: Array.from(requiredFields),
    };
}
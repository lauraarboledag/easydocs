// Convierte el template_html de una plantilla real (escrito a mano) al
// formato JSON de bloques que Tiptap entiende. NO es un parser genérico de
// HTML — está hecho a la medida de los patrones confirmados en las 14
// plantillas reglamentarias reales (encabezado fijo, título, secciones con
// h2 + tabla/párrafo, firmas, condicionales opcionales).

function extractVariableRuns(text) {
    const parts = [];
    const regex = /\{\{\s*([\w.]+)\s*\}\}/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: "text", text: text.slice(lastIndex, match.index) });
        }
        const jinjaKey = match[1];
        parts.push({
            type: "variableChip",
            attrs: { jinjaKey, label: jinjaKey },
        });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push({ type: "text", text: text.slice(lastIndex) });
    }
    return parts.filter((p) => !(p.type === "text" && p.text === ""));
}

function translateParagraph(el) {
    const runs = extractVariableRuns(el.textContent);
    if (runs.length === 0) return null;
    return { type: "paragraph", content: runs };
}

function translateHeading(el) {
    const level = parseInt(el.tagName.replace("H", ""), 10) || 2;
    return {
        type: "sectionHeading",
        attrs: { level, text: el.textContent.trim() },
    };
}

function translateTable(el) {
    const rows = Array.from(el.querySelectorAll("tr"));

    // Caso "Tabla dinámica": buscamos la fila marcador que insertamos en el
    // preprocesamiento (ver preprocessDynamicPlaceholders), en vez de
    // buscar {{ filas_x }} directamente en el texto — el navegador puede
    // haber movido ese texto fuera de la tabla si el HTML original lo tenía
    // suelto, sin envolver en un <tr> (comportamiento de "foster parenting"
    // del propio parser HTML, no algo que nuestro código controle).
    const dynamicRow = rows.find((r) => r.hasAttribute("data-dynamic-rows"));
    if (dynamicRow) {
        const headerRow = rows.find((r) => r !== dynamicRow && r.querySelector("th"));
        const columns = headerRow
            ? Array.from(headerRow.querySelectorAll("th")).map((th) => th.textContent.trim())
            : [];
        return { type: "dynamicTable", attrs: { columns } };
    }

    const dataRows = [];
    for (const row of rows) {
        const th = row.querySelector("th");
        const td = row.querySelector("td");
        if (!th || !td) continue;
        const varMatch = td.textContent.match(/\{\{\s*([\w.]+)\s*\}\}/);
        if (varMatch) {
            dataRows.push({ label: th.textContent.trim(), jinjaKey: varMatch[1] });
        }
    }
    if (dataRows.length > 0) {
        return { type: "dataTable", attrs: { rows: dataRows } };
    }

    return null;
}

// El navegador reubica ("foster parenting") cualquier texto suelto que
// encuentre directamente dentro de <table> pero fuera de un <tr>/<td> —
// exactamente el patrón real de nuestras tablas dinámicas
// (<table><tr>...</tr>{{ filas_x }}</table>). Para evitarlo, convertimos
// ese texto en una fila <tr> real y válida ANTES de que el navegador
// tenga oportunidad de parsear el HTML.
function preprocessDynamicPlaceholders(html) {
    return html.replace(/\{\{\s*(filas_\w+)\s*\}\}/g, (match, varName) => {
        return `<tr data-dynamic-rows="${varName}"><td></td></tr>`;
    });
}

function translateFirmas(el) {
    const labels = Array.from(el.querySelectorAll(".firma p")).map((p) =>
        p.textContent.trim(),
    );
    if (labels.length === 0) return null;
    return { type: "signatureBlock", attrs: { labels } };
}

function translateList(el, ordered) {
    const items = Array.from(el.querySelectorAll(":scope > li")).map((li) => {
        const runs = extractVariableRuns(li.textContent);
        return {
            type: "listItem",
            content: [{ type: "paragraph", content: runs }],
        };
    });
    if (items.length === 0) return null;
    return { type: ordered ? "orderedList" : "bulletList", content: items };
}

function translateElement(el) {
    const tag = el.tagName;
    if (tag === "H1" || tag === "H2" || tag === "H3" || tag === "H4") {
        return translateHeading(el);
    }
    if (tag === "TABLE") {
        return translateTable(el);
    }
    if (tag === "P") {
        return translateParagraph(el);
    }
    if (tag === "DIV" && el.classList.contains("firmas")) {
        return translateFirmas(el);
    }
    if (tag === "OL") {
        return translateList(el, true);
    }
    if (tag === "UL") {
        return translateList(el, false);
    }
    return null;
}

// Detecta si un nodo de texto es el inicio de un {% if variable %}
function matchIfStart(text) {
    const m = text.match(/\{%\s*if\s+([\w.]+)\s*%\}/);
    return m ? m[1] : null;
}

// Detecta si un nodo de texto contiene un {% endif %}
function matchEndif(text) {
    return /\{%\s*endif\s*%\}/.test(text);
}

// Recorre un array de nodos DOM (elementos Y nodos de texto sueltos) y los
// convierte en bloques. Es recursiva: se llama a sí misma tanto para abrir
// un <div class="section"> como para procesar el contenido interno de una
// sección condicional — así, un {% if %} puede detectarse en cualquier
// nivel de anidación, no solo en el nivel superior del documento.
function translateNodesToBlocks(nodes) {
    const blocks = [];
    const skippedTags = [];
    let i = 0;

    while (i < nodes.length) {
        const node = nodes[i];

        // --- Nodo de texto suelto: puede ser un marcador {% if %}/{% endif %} ---
        if (node.nodeType === Node.TEXT_NODE) {
            const conditionVar = matchIfStart(node.textContent);
            if (conditionVar) {
                // Recolecta todos los nodos siguientes hasta encontrar el
                // {% endif %} correspondiente.
                const innerNodes = [];
                i++;
                while (i < nodes.length) {
                    const current = nodes[i];
                    if (current.nodeType === Node.TEXT_NODE && matchEndif(current.textContent)) {
                        i++; // consume el {% endif %}
                        break;
                    }
                    innerNodes.push(current);
                    i++;
                }

                // Caso especial: el {% if institucion.logo_url %} envuelve el
                // bloque del logo, que el compilador regenera automáticamente.
                // Se descarta entero, NO se crea una sección condicional real.
                if (conditionVar === "institucion.logo_url") {
                    continue;
                }

                const inner = translateNodesToBlocks(innerNodes);
                blocks.push({
                    type: "conditionalSection",
                    attrs: { conditionVar },
                    content: inner.blocks.length ? inner.blocks : [{ type: "paragraph" }],
                });
                skippedTags.push(...inner.skippedTags);
                continue;
            }

            // Texto suelto SIN marcador {% if/endif %}: si tiene contenido real
            // (no solo espacios en blanco entre etiquetas), probablemente es
            // texto con variables que vive suelto dentro de un <div> genérico
            // (ej. <div class="folio">Folio: {{ folio }}</div>), no envuelto en
            // <p>. Se traduce igual que un párrafo, para no perderlo.
            if (node.textContent.trim() !== "") {
                const runs = extractVariableRuns(node.textContent.trim());
                if (runs.length > 0) {
                    blocks.push({ type: "paragraph", content: runs });
                }
            }
            i++;
            continue;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            i++;
            continue;
        }

        // --- Nodo elemento ---
        if (node.tagName === "DIV" && node.classList.contains("header")) {
            i++;
            continue;
        }
        if (node.tagName === "DIV" && node.classList.contains("title")) {
            i++;
            continue;
        }
        if (node.tagName === "DIV" && node.querySelector("img")) {
            // El bloque del logo — se descarta a propósito, el compilador
            // lo regenera automáticamente.
            i++;
            continue;
        }
        if (node.tagName === "DIV" && node.classList.contains("firmas")) {
            const block = translateFirmas(node);
            if (block) blocks.push(block);
            else skippedTags.push(node.tagName);
            i++;
            continue;
        }
        if (node.tagName === "DIV") {
            // Cualquier <div> (incluido .section, .footer, o cualquier otro
            // no anticipado): se "abre" y se procesan sus nodos internos con
            // la misma función, en vez de tirar el bloque completo.
            const inner = translateNodesToBlocks(Array.from(node.childNodes));
            blocks.push(...inner.blocks);
            skippedTags.push(...inner.skippedTags);
            i++;
            continue;
        }

        const block = translateElement(node);
        if (block) blocks.push(block);
        else skippedTags.push(node.tagName);
        i++;
    }

    return { blocks, skippedTags };
}

export function translateHtmlToBlocks(html) {
    const preprocessed = preprocessDynamicPlaceholders(html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(preprocessed, "text/html");
    const result = translateNodesToBlocks(Array.from(doc.body.childNodes));
    return {
        doc: { type: "doc", content: result.blocks },
        skippedTags: result.skippedTags,
    };
}
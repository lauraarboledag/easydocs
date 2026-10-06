const CONDITIONAL_TOKEN_RE =
    /\{%-?\s*if\s+([\w.]+)\s*-?%\}|\{%-?\s*(endif)\s*-?%\}|\{\{\s*([\w.]+)\s*(?:\|[^}]*)?\}\}/g;

// Campo de la plantilla → campo del estudiante. Ajusta las claves a las del LR002.
export const GUARDIAN_AUTOFILL = {
    nombre_representante: "guardian_name",
    documento_representante: "guardian_document",
    direccion_representante: "guardian_address",
    telefono_representante: "guardian_phone",
};

// Lee el template_html y devuelve qué campos dependen de cada condición.
export function analyzeConditionals(templateHtml = "") {
    const byCondition = {};
    const always = new Set();
    const stack = [];
    for (const m of templateHtml.matchAll(CONDITIONAL_TOKEN_RE)) {
        const [, ifVar, endif, variable] = m;
        if (ifVar) {
            stack.push(ifVar);
            if (!ifVar.startsWith("institucion.")) byCondition[ifVar] ??= new Set();
        } else if (endif) {
            stack.pop();
        } else if (variable) {
            const conds = stack.filter((c) => !c.startsWith("institucion."));
            if (conds.length === 0) always.add(variable);
            else conds.forEach((c) => byCondition[c].add(variable));
        }
    }
    return { conditions: Object.keys(byCondition), byCondition, always };
}

export function isFieldHidden(field, analysis, formData) {
    if (analysis.always.has(field)) return false;
    return analysis.conditions.some(
        (c) => analysis.byCondition[c].has(field) && !formData[c],
    );
}

// Condiciones cuya sección contiene datos del representante (p. ej. es_menor_edad).
export function getMinorConditions(analysis) {
    const guardianKeys = Object.keys(GUARDIAN_AUTOFILL);
    return analysis.conditions.filter((c) =>
        [...analysis.byCondition[c]].some((f) => guardianKeys.includes(f)),
    );
}
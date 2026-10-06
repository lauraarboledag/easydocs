// Datos de la institución que pueden aparecer en las plantillas como
// {{ institucion.<variable> }}, y a qué campo del perfil corresponden.
// Nombre, licencia y DANE son datos legales: no se editan desde la institución.
export const INSTITUTION_FIELDS = {
    nombre: { key: "name", label: "Nombre de la institución", editable: false },
    licencia: { key: "license_number", label: "Licencia de funcionamiento", editable: false },
    dane_code: { key: "dane_code", label: "Código DANE", editable: false },
    nivel_educativo: { key: "education_level", label: "Nivel educativo", editable: true },
    departamento: { key: "department", label: "Departamento", editable: true },
    municipio: { key: "municipality", label: "Municipio", editable: true },
    direccion: { key: "address", label: "Dirección", editable: true },
    telefono: { key: "phone", label: "Teléfono", editable: true, type: "tel" },
    email: { key: "email", label: "Correo electrónico", editable: true, type: "email" },
};

// Campos editables, en el orden en que se muestran en Configuración
export const EDITABLE_INSTITUTION_FIELDS = Object.values(INSTITUTION_FIELDS).filter(
    (f) => f.editable,
);

// Variables institucion.* que usa una plantilla (en el orden de INSTITUTION_FIELDS)
export function getInstitutionVarsUsed(templateHtml = "") {
    const used = new Set();
    for (const m of templateHtml.matchAll(/\{\{\s*institucion\.(\w+)/g)) {
        used.add(m[1]);
    }
    return Object.keys(INSTITUTION_FIELDS).filter((v) => used.has(v));
}

// --- Validaciones (mismas reglas que el backend) ---
const PHONE_RE = /^\+?[\d\s-]+$/;
export function isValidPhone(value) {
    const v = (value || "").trim();
    if (!v) return true;
    const digits = v.replace(/\D/g, "").length;
    return PHONE_RE.test(v) && digits >= 7 && digits <= 15;
}

export function isValidEmail(value) {
    const v = (value || "").trim();
    if (!v) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Valida un formulario { campo: valor } de la institución.
// Devuelve un mensaje de error o "" si todo está bien.
export function validateInstitutionForm(form, { requireAll = false } = {}) {
    const missing = Object.entries(form)
        .filter(([, value]) => !(value || "").trim())
        .map(([key]) => EDITABLE_INSTITUTION_FIELDS.find((f) => f.key === key)?.label || key);
    if (requireAll && missing.length > 0) {
        return `Completa los datos de tu institución: ${missing.join(", ")}.`;
    }
    if ("phone" in form && !isValidPhone(form.phone)) {
        return "El teléfono de la institución solo puede tener números, espacios, guiones y + al inicio (entre 7 y 15 dígitos).";
    }
    if ("email" in form && !isValidEmail(form.email)) {
        return "El correo de la institución no es válido.";
    }
    return "";
}

// FastAPI devuelve "detail" como texto o como arreglo (errores 422 de Pydantic)
export function formatApiError(err, fallback) {
    const detail = err?.response?.data?.detail;
    if (Array.isArray(detail)) {
        return detail.map((e) => (e.msg || "").replace(/^Value error, /, "")).join(" ");
    }
    if (typeof detail === "string") return detail;
    return detail?.message || fallback;
}
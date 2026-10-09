export const SUPPORT_OPTIONS = [
    { value: "ninguno", label: "Sin soporte" },
    { value: "email", label: "Soporte por correo" },
    { value: "email_chat", label: "Soporte por correo y chat" },
    { value: "prioritario", label: "Soporte prioritario" },
];

// Valores por defecto de cada plan (los mismos con que se crean)
export const DEFAULT_FEATURES = {
    free: {
        documentos_lr001_lr009: true,
        certificados_capitulo_ii: false,
        edubot: false,
        transcripcion_audio: false,
        usuarios_maximos: 1,
        documentos_por_mes: 10,
        mensajes_edubot_por_mes: 30,
        soporte: "ninguno",
    },
    basic: {
        documentos_lr001_lr009: true,
        certificados_capitulo_ii: false,
        edubot: false,
        transcripcion_audio: false,
        usuarios_maximos: 3,
        documentos_por_mes: 50,
        mensajes_edubot_por_mes: 200,
        soporte: "email",
    },
    professional: {
        documentos_lr001_lr009: true,
        certificados_capitulo_ii: true,
        edubot: true,
        transcripcion_audio: false,
        usuarios_maximos: 10,
        documentos_por_mes: 200,
        mensajes_edubot_por_mes: null,
        soporte: "email_chat",
    },
    enterprise: {
        documentos_lr001_lr009: true,
        certificados_capitulo_ii: true,
        edubot: true,
        transcripcion_audio: false, // la función aún no existe
        usuarios_maximos: null,
        documentos_por_mes: null,
        mensajes_edubot_por_mes: null,
        soporte: "prioritario",
    },
};

// Interruptores sí/no que se muestran en AdminPlans
export const TOGGLE_FEATURES = [
    { key: "documentos_lr001_lr009", label: "Libros reglamentarios LR001 – LR009" },
    { key: "certificados_capitulo_ii", label: "Certificados y constancias (Capítulo II)" },
    { key: "edubot", label: "Borrador de documentos con IA (actas, PEI y autoevaluación)" },
    { key: "transcripcion_audio", label: "Transcripción de audio IA" },
];

// Límites numéricos (null = ilimitado)
export const LIMIT_FEATURES = [
    { key: "usuarios_maximos", label: "Usuarios", unit: "usuarios" },
    { key: "documentos_por_mes", label: "Documentos por mes", unit: "documentos / mes" },
    { key: "mensajes_edubot_por_mes", label: "Consultas a EduBot por mes", unit: "consultas / mes" },
];

export function featuresWithDefaults(planName, features) {
    return { ...(DEFAULT_FEATURES[planName] || {}), ...(features || {}) };
}

export function describePlanFeatures(features, planName) {
    const f = featuresWithDefaults(planName, features);
    const items = [];
    if (f.documentos_lr001_lr009) items.push("LR001 – LR009");
    if (f.certificados_capitulo_ii) items.push("Certificados Capítulo II");
    if ("usuarios_maximos" in f) {
        items.push(
            f.usuarios_maximos == null
                ? "Usuarios ilimitados"
                : `${f.usuarios_maximos} usuario${f.usuarios_maximos !== 1 ? "s" : ""}`,
        );
    }
    if ("documentos_por_mes" in f) {
        items.push(
            f.documentos_por_mes == null
                ? "Documentos ilimitados"
                : `${f.documentos_por_mes} documentos / mes`,
        );
    }
    if ("mensajes_edubot_por_mes" in f) {
        items.push(
            f.mensajes_edubot_por_mes == null
                ? "Chat EduBot ilimitado"
                : `Chat EduBot: ${f.mensajes_edubot_por_mes} consultas / mes`,
        );
    }
    if (f.edubot) items.push("Borrador de documentos con IA");
    if (f.transcripcion_audio) items.push("Transcripción de audio IA");
    const support = SUPPORT_OPTIONS.find((o) => o.value === f.soporte);
    if (support && support.value !== "ninguno") items.push(support.label);
    return items;
}

// Qué función del plan habilita cada tipo de plantilla (igual que el backend)
const CHAPTER_II_TYPES = [
    "certificado_aptitud_laboral",
    "certificado_aptitud_salud",
    "certificado_conocimientos",
    "constancia_asistencia",
    "constancia_estudio",
];

export function templateFeatureKey(documentType = "") {
    if (documentType.startsWith("LR")) return "documentos_lr001_lr009";
    if (CHAPTER_II_TYPES.includes(documentType)) return "certificados_capitulo_ii";
    return null;
}

// true si el plan desactiva explícitamente esta plantilla
export function isTemplateLocked(documentType, features) {
    const key = templateFeatureKey(documentType);
    return !!(key && features && features[key] === false);
}
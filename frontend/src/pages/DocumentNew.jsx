import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import Sidebar from "../components/layout/Sidebar";
import EduBot from "../components/EduBot";
import useInactivity from "../hooks/useInactivity";
import InactivityModal from "../components/InactivityModal";
import {
  analyzeConditionals,
  isFieldHidden,
  getMinorConditions,
  GUARDIAN_AUTOFILL,
} from "../utils/templateConditionals";
import {
  INSTITUTION_FIELDS,
  getInstitutionVarsUsed,
  validateInstitutionForm,
  isValidPhone,
  formatApiError,
} from "../utils/institutionFields";
import { isTemplateLocked } from "../utils/planFeatures";
import {
  FileText,
  ChevronLeft,
  Download,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Bell,
  BookOpen,
  Award,
  TrendingUp,
  Crown,
  Eye,
  ImageIcon,
  Plus,
  X,
  Sparkles,
  Building2,
  Lock,
  Droplets,
  Save,
  Bot,
  Loader2,
} from "lucide-react";

const FIELD_LABELS = {
  nombre_estudiante: "Nombre del estudiante",
  documento_estudiante: "Documento de identidad",
  tipo_documento: "Tipo de documento",
  lugar_expedicion: "Lugar de expedición",
  nombre_programa: "Nombre del programa",
  nombre_curso: "Nombre del curso",
  duracion_horas: "Duración en horas",
  total_horas: "Total de horas",
  resolucion_programa: "Resolución del programa",
  numero_libro: "Número del libro",
  folio: "Folio",
  fecha_registro: "Fecha de registro",
  numero_matricula: "Número de matrícula",
  folio_matricula: "Folio de matrícula",
  anio_inicio: "Año de inicio",
  filas_modulos: "Módulos (separados por coma)",
  filas_modulos_curso: "Módulos en curso",
  filas_calificaciones: "Calificaciones",
  filas_recuperacion: "Recuperaciones",
  filas_certificados: "Certificados",
  filas_plan_mejoramiento: "Plan de mejoramiento",
  nombre_director: "Nombre del director",
  documento_director: "Documento del director",
  numero_acta: "Número de acta",
  nombre_estamento: "Nombre del estamento",
  lugar: "Lugar de reunión",
  hora_inicio: "Hora de inicio",
  hora_fin: "Hora de finalización",
  asistentes: "Asistentes",
  ausentes: "Ausentes",
  proposito: "Propósito de la reunión",
  punto_3: "Punto 3 del orden del día",
  punto_4: "Punto 4 del orden del día",
  punto_5: "Punto 5 del orden del día",
  desarrollo: "Desarrollo de la reunión",
  acuerdos: "Acuerdos y propuestas",
  compromisos: "Compromisos",
  mision: "Misión institucional",
  vision: "Visión institucional",
  principios_fines: "Principios y fines",
  programas_registrados: "Programas registrados",
  estrategia_pedagogica: "Estrategia pedagógica",
  organizacion_administrativa: "Organización administrativa",
  reglamento: "Reglamento de estudiantes y formadores",
  autoevaluacion: "Autoevaluación institucional",
  periodo: "Período",
  resultados_autoevaluacion: "Resultados de autoevaluación",
  fortalezas: "Fortalezas identificadas",
  debilidades: "Debilidades identificadas",
  seguimiento_plan: "Seguimiento al plan anterior",
  tipo_registro: "Tipo de registro (DUPLICADO / MODIFICACIÓN)",
  numero_registro: "Número del registro inicial",
  observaciones: "Observaciones",
  total_estudiantes: "Total de estudiantes",
  primer_nombre: "Primer nombre en el registro",
  ultimo_nombre: "Último nombre en el registro",
  codigo_matricula: "Código de matrícula",
  barrio: "Barrio",
  comuna: "Comuna",
  telefono_estudiante: "Teléfono del estudiante",
  tipo_certificado: "Tipo de certificado que otorga",
  direccion: "Dirección de residencia",
  es_menor_edad: "El estudiante es menor de edad",
  dia: "Día",
  mes: "Mes",
  anio: "Año",
};

const MULTILINE_FIELDS = [
  "asistentes",
  "ausentes",
  "proposito",
  "desarrollo",
  "acuerdos",
  "compromisos",
  "mision",
  "vision",
  "principios_fines",
  "programas_registrados",
  "estrategia_pedagogica",
  "organizacion_administrativa",
  "reglamento",
  "autoevaluacion",
  "resultados_autoevaluacion",
  "fortalezas",
  "debilidades",
  "seguimiento_plan",
  "observaciones",
  "filas_modulos",
  "filas_modulos_curso",
  "filas_calificaciones",
  "filas_recuperacion",
  "filas_certificados",
  "filas_plan_mejoramiento",
  "punto_3",
  "punto_4",
  "punto_5",
];

const CHAPTER_GROUPS = {
  "Capítulo I — Libros Reglamentarios (LR001–LR009)": [
    "LR001",
    "LR002",
    "LR003",
    "LR004",
    "LR005",
    "LR006",
    "LR007",
    "LR008",
    "LR009",
  ],
  "Capítulo II — Certificados y Constancias": [
    "certificado_aptitud_laboral",
    "certificado_aptitud_salud",
    "certificado_conocimientos",
    "constancia_asistencia",
    "constancia_estudio",
  ],
  Personalizados: ["personalizado"],
};

const LOGO_POSITIONS = [
  { id: "top-left", label: "Arriba izquierda" },
  { id: "top-center", label: "Arriba centro" },
  { id: "top-right", label: "Arriba derecha" },
];

function RocketAnimation() {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="text-8xl mb-4 animate-bounce">🚀</div>
        <p className="text-white text-xl font-bold mb-2">
          Generando tu documento...
        </p>
        <p className="text-white/70 text-sm">Esto tomará solo un momento</p>
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function isTableField(template, field) {
  return !!(template?.table_columns && field in template.table_columns);
}

// Campos que se pueden autollenar desde una matrícula (estudiante + programa)
const AUTOFILL_FIELDS = [
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
  "numero_matricula",
  "folio",
  "dia",
  "mes",
  "anio",
  ...Object.keys(GUARDIAN_AUTOFILL),
];

// El autollenado solo tiene sentido si el documento es sobre un estudiante
const STUDENT_KEY_FIELDS = ["nombre_estudiante", "documento_estudiante"];

function conditionLabel(cond) {
  return FIELD_LABELS[cond] || cond.replace(/_/g, " ").replace(/^\w/, (l) => l.toUpperCase());
}

const buildEnrollmentData = (enrollment) => {
  const now = new Date();
  const { student, program } = enrollment;
  return {
    nombre_estudiante: student.full_name,
    tipo_documento: student.document_type || "",
    documento_estudiante: student.document_number || "",
    lugar_expedicion: student.document_place || "",
    direccion: student.address || "",
    barrio: student.neighborhood || "",
    comuna: student.commune || "",
    telefono_estudiante: student.phone || "",
    nombre_programa: program.name,
    tipo_certificado:
      enrollment.certificate_type || program.certificate_type || "",
    numero_matricula: enrollment.enrollment_number || "",
    folio: enrollment.folio || "",
    dia: now.getDate().toString(),
    mes: now.toLocaleString("es-CO", { month: "long" }),
    anio: enrollment.year || now.getFullYear().toString(),
    ...Object.fromEntries(
      Object.entries(GUARDIAN_AUTOFILL).map(([key, studentKey]) => [
        key,
        enrollment.student?.[studentKey] || "",
      ]),
    ),
  };
};

// Marca visible en la vista previa mientras el texto de EduBot no se ha revisado
const AI_PREVIEW_MARK = `<div style="position:fixed;top:45%;left:0;right:0;text-align:center;transform:rotate(-30deg);font:700 34px Arial,sans-serif;color:rgba(180,83,9,0.18);letter-spacing:3px;pointer-events:none;z-index:9999;">BORRADOR – PENDIENTE DE REVISIÓN</div>`;

const withAiMark = (html) =>
  html.includes("</body>")
    ? html.replace("</body>", `${AI_PREVIEW_MARK}</body>`)
    : html + AI_PREVIEW_MARK;

export default function DocumentNew() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [createdDoc, setCreatedDoc] = useState(null);
  const [error, setError] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [limitModal, setLimitModal] = useState(null);
  const [activeChapter, setActiveChapter] = useState(
    Object.keys(CHAPTER_GROUPS)[0],
  );
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [logoPosition, setLogoPosition] = useState("top-left");
  const [watermark, setWatermark] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [institution, setInstitution] = useState(null);
  const [instForm, setInstForm] = useState({});
  // Borradores: ?draft=<id> abre un borrador guardado para continuarlo
  const [searchParams, setSearchParams] = useSearchParams();
  const draftParam = searchParams.get("draft");
  const [draftId, setDraftId] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [notice, setNotice] = useState("");
  const draftLoaded = useRef(false);
  // Borrador con IA (EduBot redacta campos de texto largo)
  const [aiConfig, setAiConfig] = useState(null);
  // Funciones del plan activo (para marcar plantillas no incluidas)
  const [planFeatures, setPlanFeatures] = useState(null);
  const [lockedTemplate, setLockedTemplate] = useState(null);
  const [aiFields, setAiFields] = useState([]); // campos con texto de EduBot
  const [aiReviewed, setAiReviewed] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiNotes, setAiNotes] = useState("");
  const [aiSelected, setAiSelected] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const conditionals = useMemo(
    () => analyzeConditionals(selectedTemplate?.template_html || ""),
    [selectedTemplate],
  );

  // Datos de la institución que usa la plantilla elegida
  const institutionVars = useMemo(
    () => getInstitutionVarsUsed(selectedTemplate?.template_html || ""),
    [selectedTemplate],
  );
  // Campos que EduBot puede redactar en la plantilla elegida
  const aiDraftable = useMemo(() => {
    if (!selectedTemplate || !aiConfig?.fields) return [];
    const list = aiConfig.fields[selectedTemplate.document_type] || [];
    return list.filter((f) => selectedTemplate.required_fields.includes(f.name));
  }, [selectedTemplate, aiConfig]);

  const editableInstVars = institutionVars.filter((v) => INSTITUTION_FIELDS[v].editable);
  const readonlyInstVars = institutionVars.filter((v) => !INSTITUTION_FIELDS[v].editable);

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        const res = await api.get("/institutions/my");
        setInstitution(res.data);
        // Preferencias del logo guardadas en Configuración
        // (si se abre un borrador, manda lo que se guardó con él)
        if (!draftParam) {
          setLogoPosition(res.data.logo_position || "top-left");
          setWatermark(!!res.data.logo_watermark && !!res.data.logo_url);
        }
      } catch {
        setInstitution(null); // sin datos, el recuadro no se muestra
      }
    };
    fetchInstitution();
  }, []);

  // Precarga el recuadro con lo guardado en el perfil de la institución
  useEffect(() => {
    if (!selectedTemplate || !institution) return;
    const form = {};
    getInstitutionVarsUsed(selectedTemplate.template_html || "").forEach((v) => {
      const field = INSTITUTION_FIELDS[v];
      if (field.editable) form[field.key] = institution[field.key] || "";
    });
    setInstForm(form);
  }, [selectedTemplate, institution]);

  useEffect(() => {
    const fetchAiConfig = async () => {
      try {
        const res = await api.get("/edubot/draft/config");
        setAiConfig(res.data);
      } catch {
        setAiConfig(null); // sin configuración, no se muestra la opción
      }
    };
    fetchAiConfig();
    api
      .get("/subscriptions/my")
      .then((res) => setPlanFeatures(res.data?.plan?.features || null))
      .catch(() => setPlanFeatures(null));
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("/templates/");
        setTemplates(res.data);
      } catch {
        setError("Error cargando plantillas.");
      }
    };
    fetchTemplates();
  }, []);

  // Abre un borrador (?draft=<id>) cuando ya están las plantillas
  useEffect(() => {
    if (!draftParam || templates.length === 0 || draftLoaded.current) return;
    draftLoaded.current = true;
    const loadDraft = async () => {
      try {
        const res = await api.get(`/documents/${draftParam}`);
        const doc = res.data;
        if (!["draft", "ai_draft"].includes(doc.status)) {
          setError("Este documento ya fue generado; descárgalo desde Documentos.");
          return;
        }
        const template = templates.find((t) => t.id === doc.template_id);
        if (!template) {
          setError("La plantilla de este borrador ya no está disponible.");
          return;
        }
        const { _opciones: opciones, _ia: iaInfo, ...saved } = doc.document_data || {};
        // Parte de los campos vacíos de la plantilla y encima lo guardado
        const initial = {};
        template.required_fields.forEach((f) => {
          initial[f] = isTableField(template, f) ? [] : "";
        });
        analyzeConditionals(template.template_html || "").conditions.forEach((c) => {
          initial[c] = false;
        });
        setSelectedTemplate(template);
        setFormData({ ...initial, ...saved });
        if (opciones?.logo_position) setLogoPosition(opciones.logo_position);
        if (typeof opciones?.marca_agua === "boolean") setWatermark(opciones.marca_agua);
        setSelectedEnrollmentId("");
        setDraftId(doc.id);
        setAiFields(Array.isArray(iaInfo?.campos) ? iaInfo.campos : []);
        setAiReviewed(false);
        setStep(2);
        setNotice(
          doc.status === "ai_draft"
            ? "Este borrador tiene texto redactado por EduBot. Revísalo y corrígelo antes de generarlo."
            : "Continuando borrador. Puedes seguir llenándolo y guardarlo cuantas veces quieras.",
        );
      } catch {
        setError("No se pudo abrir el borrador.");
      }
    };
    loadDraft();
  }, [draftParam, templates]);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await api.get("/enrollments/");
        const sorted = [...res.data].sort((a, b) =>
          a.student.full_name.localeCompare(b.student.full_name, "es"),
        );
        setEnrollments(sorted);
      } catch {
        // Si falla, el documento se sigue pudiendo llenar a mano
        setEnrollments([]);
      }
    };
    fetchEnrollments();
  }, []);

  useInactivity({
    timeout: 30,
    onWarning: () => setShowInactivity(true),
    onLogout: () => {
      setShowInactivity(false);
      logout();
      navigate("/");
    },
  });

  // Vuelve a las preferencias de logo de la institución
  const resetLogoOptions = () => {
    setLogoPosition(institution?.logo_position || "top-left");
    setWatermark(!!institution?.logo_watermark && !!institution?.logo_url);
  };

  const handleSelectTemplate = (template) => {
    // Otra plantilla = documento nuevo (el borrador abierto queda como estaba)
    if (draftId && selectedTemplate?.id !== template.id) {
      setDraftId(null);
      setSearchParams({});
    }
    setNotice("");
    setAiFields([]);
    setAiReviewed(false);
    setSelectedTemplate(template);
    resetLogoOptions();
    const initial = {};
    setSelectedEnrollmentId("");
    template.required_fields.forEach((f) => {
      initial[f] = isTableField(template, f) ? [] : "";
    });
    analyzeConditionals(template.template_html || "").conditions.forEach((c) => {
      initial[c] = false;
    });
    setFormData(initial);
    setStep(2);
    setError("");
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSelectEnrollment = (id) => {
    setSelectedEnrollmentId(id);
    if (!selectedTemplate) return;

    const enrollment = enrollments.find((e) => String(e.id) === String(id));
    const source = enrollment ? buildEnrollmentData(enrollment) : null;

    setFormData((prev) => {
      const next = { ...prev };
      selectedTemplate.required_fields.forEach((f) => {
        if (!AUTOFILL_FIELDS.includes(f)) return;
        if (isTableField(selectedTemplate, f)) return;
        next[f] = source ? source[f] : ""; // sin selección => limpia esos campos
      });
      return next;
    });
    // Marca/desmarca la condición de menor de edad según el estudiante
    const minorConditions = getMinorConditions(conditionals);
    if (minorConditions.length > 0) {
      setFormData((prev) => {
        const next = { ...prev };
        minorConditions.forEach((c) => {
          next[c] = !!enrollment?.student?.is_minor;
        });
        return next;
      });
    }
    setError("");
  };

  const addTableRow = (field) => {
    const columns = selectedTemplate.table_columns[field];
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), columns.map(() => "")],
    }));
    setError("");
  };

  const removeTableRow = (field, rowIndex) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== rowIndex),
    }));
  };

  const updateTableCell = (field, rowIndex, colIndex, value) => {
    setFormData((prev) => {
      const rows = [...(prev[field] || [])];
      rows[rowIndex] = [...rows[rowIndex]];
      rows[rowIndex][colIndex] = value;
      return { ...prev, [field]: rows };
    });
  };

  // Guarda en el perfil los datos de la institución que se completaron aquí
  const saveInstitutionChanges = async () => {
    if (!institution || Object.keys(instForm).length === 0) return true;
    const instError = validateInstitutionForm(instForm, { requireAll: true });
    if (instError) {
      setError(instError);
      return false;
    }
    const changed = Object.fromEntries(
      Object.entries(instForm)
        .map(([key, value]) => [key, (value || "").trim()])
        .filter(([key, value]) => value !== (institution[key] || "")),
    );
    if (Object.keys(changed).length === 0) return true;
    try {
      const res = await api.put("/institutions/my", changed);
      setInstitution(res.data);
      return true;
    } catch (err) {
      setError(formatApiError(err, "No se pudieron guardar los datos de la institución."));
      return false;
    }
  };

  const handleGoToPreview = async (position = logoPosition) => {
    const empty = selectedTemplate.required_fields.filter((f) => {
      if (conditionals.conditions.includes(f)) return false;
      if (isFieldHidden(f, conditionals, formData)) return false;
      if (isTableField(selectedTemplate, f)) {
        return !formData[f] || formData[f].length === 0;
      }
      return !formData[f];
    });
    if (empty.length > 0) {
      setError(
        `Completa los campos obligatorios: ${empty.map((f) => FIELD_LABELS[f] || f).join(", ")}`,
      );
      return;
    }
    setPreviewLoading(true);
    setError("");
    // Primero los datos de la institución: la vista previa y el PDF los leen del perfil
    const instOk = await saveInstitutionChanges();
    if (!instOk) {
      setPreviewLoading(false);
      return;
    }
    try {
      const res = await api.post(`/templates/${selectedTemplate.id}/preview`, {
        document_data: formData,
        logo_position: position,
        watermark,
      });
      setPreviewHtml(res.data.html);
      setStep(3);
    } catch {
      setError("Error cargando la vista previa. Intenta de nuevo.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const refreshPreview = async (position, withWatermark) => {
    setPreviewLoading(true);
    try {
      const res = await api.post(`/templates/${selectedTemplate.id}/preview`, {
        document_data: formData,
        logo_position: position,
        watermark: withWatermark,
      });
      setPreviewHtml(res.data.html);
    } catch {
      setError("Error actualizando la vista previa.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleLogoPositionChange = (position) => {
    setLogoPosition(position);
    refreshPreview(position, watermark);
  };

  const handleWatermarkChange = (value) => {
    setWatermark(value);
    refreshPreview(logoPosition, value);
  };

  const hasLogo = !!institution?.logo_url;

  // --- Borrador con IA ---
  const isEmptyValue = (v) => !v || (typeof v === "string" && !v.trim());

  const openAiModal = () => {
    // Por defecto se marcan los campos que siguen vacíos
    const empty = aiDraftable.filter((f) => isEmptyValue(formData[f.name])).map((f) => f.name);
    setAiSelected(empty.length > 0 ? empty : aiDraftable.map((f) => f.name));
    setAiError("");
    setShowAiModal(true);
  };

  const toggleAiField = (name) => {
    setAiSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handleAiDraft = async () => {
    if (aiSelected.length === 0) {
      setAiError("Elige al menos un campo.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const res = await api.post("/edubot/draft", {
        template_id: selectedTemplate.id,
        fields: aiSelected,
        notes: aiNotes,
        current_values: formData,
      });
      const drafted = res.data.fields || {};
      const names = Object.keys(drafted);
      setFormData((prev) => ({ ...prev, ...drafted }));
      setAiFields((prev) => [...new Set([...prev, ...names])]);
      setAiReviewed(false);
      setShowAiModal(false);
      setError("");
      setNotice(
        `EduBot redactó ${names.length} campo${names.length !== 1 ? "s" : ""}. Léelos y corrígelos: busca los [COMPLETAR] que haya dejado.`,
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail?.feature_locked) {
        setAiError("El borrador con IA no está incluido en tu plan actual.");
      } else {
        setAiError(
          (typeof detail === "string" && detail) || "No se pudo contactar a EduBot. Intenta de nuevo.",
        );
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Guarda lo que haya (aunque falten campos). No gasta cupo del plan.
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        document_data: formData,
        logo_position: logoPosition,
        watermark,
        save_as_draft: true,
        ai_fields: aiFields,
      };
      if (draftId) {
        await api.put(`/documents/${draftId}`, payload);
      } else {
        const res = await api.post("/documents/", {
          ...payload,
          template_id: selectedTemplate.id,
        });
        setDraftId(res.data.id);
        // Así, si se recarga la página, sigue en el mismo borrador
        setSearchParams({ draft: res.data.id }, { replace: true });
        draftLoaded.current = true;
      }
      const hora = new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setNotice(
        aiFields.length > 0
          ? `Borrador IA guardado a las ${hora}. Queda pendiente de revisión en Documentos → «Revisar».`
          : `Borrador guardado a las ${hora}. Lo encuentras en Documentos → «Continuar».`,
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        (typeof detail === "string" && detail) ||
        detail?.message ||
        "No se pudo guardar el borrador.",
      );
    } finally {
      setSavingDraft(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const payload = {
        document_data: formData,
        // Se guardan con el documento: el PDF sale igual que la vista previa
        logo_position: logoPosition,
        watermark,
        save_as_draft: false,
        ai_fields: aiFields,
        ai_reviewed: aiReviewed,
      };
      // Si venía de un borrador, se completa ese mismo documento
      const res = draftId
        ? await api.put(`/documents/${draftId}`, payload)
        : await api.post("/documents/", { ...payload, template_id: selectedTemplate.id });
      setCreatedDoc(res.data);
      setDraftId(null);
      setNotice("");
      setAiFields([]);
      setAiReviewed(false);
      setStep(4);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 403 && detail?.limit_reached) {
        setLimitModal({ limit: detail.limit, used: detail.used });
      } else {
        setError(detail?.message || detail || "Error al crear el documento.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!createdDoc) return;
    setDownloading(true);
    try {
      const res = await api.get(`/documents/${createdDoc.id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedTemplate.name}_${createdDoc.id.split("-")[0]}.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch {
      setError("Error al generar el PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const getTemplatesByChapter = (chapterTypes) =>
    templates.filter((t) => chapterTypes.includes(t.document_type));

  const STEPS = ["Tipo de documento", "Datos", "Vista previa", "Descargar"];

  return (
    <div
      className="min-h-screen flex overflow-x-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {loading && <RocketAnimation />}

      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="md:ml-56 flex-1 flex flex-col min-w-0">
        <header
          className="border-b pl-16 pr-4 md:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-10"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() =>
                step === 1 ? navigate("/documentos") : setStep(step - 1)
              }
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1
                className="text-lg font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                Nuevo documento
              </h1>
              <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                {step === 1 && "Selecciona el tipo de documento"}
                {step === 2 && selectedTemplate?.name}
                {step === 3 && "Revisa tu documento antes de generarlo"}
                {step === 4 && "Documento generado"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button className="p-2" style={{ color: "var(--text-secondary)" }}>
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p
                className="hidden sm:block text-sm font-medium truncate max-w-[160px]"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full min-w-0">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 md:mb-8">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      backgroundColor:
                        step > i + 1
                          ? "#22c55e"
                          : step === i + 1
                            ? "var(--color-primary)"
                            : "var(--bg-primary)",
                      color:
                        step >= i + 1 ? "#ffffff" : "var(--text-secondary)",
                      border:
                        step <= i + 1
                          ? "2px solid var(--border-color)"
                          : "none",
                    }}
                  >
                    {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span
                    className="text-sm font-medium hidden sm:block"
                    style={{
                      color:
                        step >= i + 1
                          ? "var(--color-primary)"
                          : "var(--text-secondary)",
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <ChevronRight
                    size={14}
                    className="mx-0.5 sm:mx-1"
                    style={{ color: "var(--border-color)" }}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {notice && !error && step === 2 && (
            <div
              className="border px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2"
              style={{
                backgroundColor: "var(--color-primary-light)",
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
              }}
            >
              <Save size={16} className="flex-shrink-0" /> {notice}
            </div>
          )}

          {/* Paso 1 — Selección */}
          {step === 1 && (
            <div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Selecciona el tipo de documento
              </h2>
              <p
                className="text-sm mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                Elige la plantilla reglamentaria que necesitas generar.
              </p>
              <div
                className="flex gap-1 p-1 rounded-xl mb-6 border"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                {Object.keys(CHAPTER_GROUPS).map((chapter) => {
                  const isLR = chapter.includes("LR");
                  const isPersonalizados = chapter === "Personalizados";
                  const Icon = isLR ? BookOpen : isPersonalizados ? Sparkles : Award;
                  const fullLabel = isLR
                    ? "Libros Reglamentarios"
                    : isPersonalizados
                      ? "Personalizados"
                      : "Certificados y Constancias";
                  const shortLabel = isLR
                    ? "Capítulo I"
                    : isPersonalizados
                      ? "Personalizados"
                      : "Capítulo II";
                  return (
                    <button
                      key={chapter}
                      onClick={() => setActiveChapter(chapter)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor:
                          activeChapter === chapter ? "var(--color-primary)" : "transparent",
                        color:
                          activeChapter === chapter ? "#ffffff" : "var(--text-secondary)",
                      }}
                    >
                      <Icon size={14} />
                      <span className="hidden sm:block">{fullLabel}</span>
                      <span className="sm:hidden">{shortLabel}</span>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getTemplatesByChapter(CHAPTER_GROUPS[activeChapter]).map(
                  (template) => {
                    const locked = isTemplateLocked(template.document_type, planFeatures);
                    return (
                      <button
                        key={template.id}
                        onClick={() =>
                          locked ? setLockedTemplate(template) : handleSelectTemplate(template)
                        }
                        className="flex items-center justify-between p-5 border rounded-xl transition-all text-left group hover:shadow-sm"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          borderColor: "var(--border-color)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            "var(--color-primary)";
                          e.currentTarget.style.backgroundColor =
                            "var(--color-primary-light)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            "var(--border-color)";
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-secondary)";
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: "var(--color-primary-light)",
                            }}
                          >
                            <FileText
                              size={18}
                              style={{ color: "var(--color-icon)" }}
                            />
                          </div>
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {template.name}
                            </p>
                            {template.description && (
                              <p
                                className="text-xs mt-0.5 line-clamp-1"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                {template.description}
                              </p>
                            )}
                            {locked ? (
                              <p className="text-xs mt-1 flex items-center gap-1 font-medium text-amber-600">
                                <Lock size={11} /> No incluido en tu plan
                              </p>
                            ) : (
                              <p
                                className="text-xs mt-1"
                                style={{ color: "var(--color-primary)" }}
                              >
                                {template.required_fields.length} campos requeridos
                              </p>
                            )}
                          </div>
                        </div>
                        {locked ? (
                          <Lock size={16} className="flex-shrink-0 text-amber-600" />
                        ) : (
                          <ChevronRight
                            size={16}
                            style={{ color: "var(--text-secondary)" }}
                            className="flex-shrink-0"
                          />
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* Paso 2 — Formulario */}
          {step === 2 && selectedTemplate && (
            <div>
              <div
                className="border rounded-xl p-4 mb-6 flex items-start gap-3"
                style={{
                  backgroundColor: "var(--color-primary-light)",
                  borderColor: "var(--color-primary)",
                }}
              >
                <FileText
                  size={18}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "var(--color-primary)" }}
                />
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedTemplate.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>
              <div
                className="rounded-xl border p-4 md:p-6"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <h2
                  className="text-lg font-bold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Datos del documento
                </h2>
                <p
                  className="text-sm mb-6"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Completa los campos del documento. Los datos de tu institución
                  se toman de su perfil.
                </p>
                {institution && institutionVars.length > 0 && (() => {
                  const missingCount = editableInstVars.filter(
                    (v) => !(instForm[INSTITUTION_FIELDS[v].key] || "").trim(),
                  ).length;
                  return (
                    <div
                      className="mb-6 rounded-xl border p-4"
                      style={{
                        borderColor: missingCount ? "#fde68a" : "var(--border-color)",
                        backgroundColor: missingCount ? "#fffbeb" : "var(--bg-primary)",
                      }}
                    >
                      <div className="flex items-start gap-2 mb-3">
                        <Building2
                          size={16}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: missingCount ? "#b45309" : "var(--color-primary)" }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            Datos de tu institución en este documento
                          </p>
                          <p className="text-xs" style={{ color: missingCount ? "#b45309" : "var(--text-secondary)" }}>
                            {missingCount
                              ? `Faltan ${missingCount} dato(s). Al continuar se guardan en el perfil de tu institución.`
                              : "Si los cambias aquí, se actualizan también en el perfil de tu institución."}
                          </p>
                        </div>
                      </div>
                      {readonlyInstVars.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {readonlyInstVars.map((v) => {
                            const field = INSTITUTION_FIELDS[v];
                            const value = institution[field.key];
                            return (
                              <span
                                key={v}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full max-w-full"
                                style={{
                                  backgroundColor: value ? "var(--bg-secondary)" : "#fef3c7",
                                  color: value ? "var(--text-secondary)" : "#b45309",
                                  border: "1px solid var(--border-color)",
                                }}
                                title="Dato legal: lo modifica el administrador de EasyDocs"
                              >
                                <Lock size={10} className="flex-shrink-0" />
                                <span className="truncate">
                                  {field.label}: {value || "sin registrar"}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {editableInstVars.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {editableInstVars.map((v) => {
                            const field = INSTITUTION_FIELDS[v];
                            const value = instForm[field.key] || "";
                            const invalid =
                              !value.trim() || (field.type === "tel" && !isValidPhone(value));
                            return (
                              <div key={v} className="min-w-0">
                                <label
                                  className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {field.label} *
                                </label>
                                <input
                                  type={field.type || "text"}
                                  inputMode={field.type === "tel" ? "tel" : undefined}
                                  value={value}
                                  onChange={(e) => {
                                    setInstForm((p) => ({ ...p, [field.key]: e.target.value }));
                                    setError("");
                                  }}
                                  placeholder={`Ingresa ${field.label.toLowerCase()}...`}
                                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                                  style={{
                                    borderColor: invalid ? "#f59e0b" : "var(--border-color)",
                                    backgroundColor: "var(--bg-secondary)",
                                    color: "var(--text-primary)",
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {selectedTemplate.required_fields.some((f) =>
                  STUDENT_KEY_FIELDS.includes(f),
                ) && (
                    <div className="mb-6">
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Autollenar desde una matrícula: Los datos se copian al formulario y puedes editarlos.
                      </label>
                      <select
                        value={selectedEnrollmentId}
                        onChange={(e) => handleSelectEnrollment(e.target.value)}
                        className="w-full min-w-0 border rounded-lg px-3 py-2.5 text-sm"
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          borderColor: "var(--border-color)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="">— Llenar manualmente —</option>
                        {enrollments.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.student.full_name} · {e.student.document_number} · {e.program.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                        ¿No encuentras al estudiante? Solo aparecen los que tienen matrícula.{" "}
                        <button
                          type="button"
                          onClick={() => navigate("/academico?tab=matriculas")}
                          className="font-semibold underline"
                          style={{ color: "var(--color-primary)" }}
                        >
                          Crear matrícula →
                        </button>
                      </p>
                    </div>
                  )}
                {conditionals.conditions.length > 0 && (
                  <div className="space-y-2 mb-5">
                    {conditionals.conditions.map((cond) => (
                      <label
                        key={cond}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-primary)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!formData[cond]}
                          onChange={(e) => handleChange(cond, e.target.checked)}
                          className="w-4 h-4 flex-shrink-0"
                        />
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {conditionLabel(cond)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {aiDraftable.length > 0 && aiConfig && (
                  <div
                    className="rounded-xl border p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3"
                    style={{
                      borderColor: "var(--color-primary)",
                      backgroundColor: "var(--color-primary-light)",
                    }}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "var(--color-sidebar)" }}
                      >
                        <Bot size={16} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          Redactar con EduBot
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          Escribe tus notas y EduBot redacta{" "}
                          {aiDraftable.map((f) => f.label.toLowerCase()).join(", ")}. Tú revisas antes de generar.
                        </p>
                      </div>
                    </div>
                    {aiConfig.enabled ? (
                      <button
                        type="button"
                        onClick={openAiModal}
                        className="text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm flex-shrink-0"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        <Sparkles size={15} /> Redactar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate("/suscripcion")}
                        className="border font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm flex-shrink-0"
                        style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                        title={aiConfig.configured ? "No incluido en tu plan" : "Servicio de IA no configurado"}
                      >
                        <Lock size={14} /> {aiConfig.configured ? "Ver planes" : "No disponible"}
                      </button>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedTemplate.required_fields.map((field) => {
                    if (conditionals.conditions.includes(field)) return null;
                    if (isFieldHidden(field, conditionals, formData)) return null;
                    if (isTableField(selectedTemplate, field)) {
                      const columns = selectedTemplate.table_columns[field];
                      const rows = formData[field] || [];
                      return (
                        <div key={field} className="md:col-span-2">
                          <label
                            className="block text-xs font-semibold uppercase tracking-wide mb-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Tabla de datos *
                          </label>
                          <div
                            className="border rounded-lg overflow-hidden"
                            style={{ borderColor: "var(--border-color)" }}
                          >
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm min-w-[480px]">
                                <thead>
                                  <tr style={{ backgroundColor: "var(--bg-primary)" }}>
                                    {columns.map((col) => (
                                      <th
                                        key={col}
                                        className="text-left px-3 py-2 text-xs font-semibold"
                                        style={{ color: "var(--text-secondary)" }}
                                      >
                                        {col}
                                      </th>
                                    ))}
                                    <th className="w-10" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((row, rowIndex) => (
                                    <tr
                                      key={rowIndex}
                                      className="border-t"
                                      style={{ borderColor: "var(--border-color)" }}
                                    >
                                      {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="p-1">
                                          <input
                                            type="text"
                                            value={row[colIndex] || ""}
                                            onChange={(e) =>
                                              updateTableCell(
                                                field,
                                                rowIndex,
                                                colIndex,
                                                e.target.value,
                                              )
                                            }
                                            className="w-full border-0 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1"
                                            style={{
                                              backgroundColor: "var(--bg-primary)",
                                              color: "var(--text-primary)",
                                            }}
                                          />
                                        </td>
                                      ))}
                                      <td className="p-1 text-center">
                                        <button
                                          type="button"
                                          onClick={() => removeTableRow(field, rowIndex)}
                                          style={{ color: "#dc2626" }}
                                        >
                                          <X size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <button
                              type="button"
                              onClick={() => addTableRow(field)}
                              className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium border-t"
                              style={{
                                color: "var(--color-primary)",
                                borderColor: "var(--border-color)",
                              }}
                            >
                              <Plus size={13} /> Agregar fila
                            </button>
                          </div>
                          {rows.length === 0 && (
                            <p
                              className="text-xs mt-1"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Agrega al menos una fila.
                            </p>
                          )}
                        </div>
                      );
                    }

                    const isMultiline = MULTILINE_FIELDS.includes(field);
                    const label = FIELD_LABELS[field] || field;
                    const fromAi = aiFields.includes(field);
                    return (
                      <div key={field} className={isMultiline ? "md:col-span-2" : ""}>
                        <label
                          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide mb-1"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {label} *
                          {fromAi && (
                            <span
                              className="inline-flex items-center gap-1 normal-case tracking-normal font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
                            >
                              <Sparkles size={10} /> Sugerido por EduBot · revisar
                            </span>
                          )}
                        </label>
                        {isMultiline ? (
                          <textarea
                            value={formData[field] || ""}
                            onChange={(e) => handleChange(field, e.target.value)}
                            rows={fromAi ? 6 : 3}
                            placeholder={`Ingresa ${label.toLowerCase()}...`}
                            className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
                            style={{
                              borderColor: "var(--border-color)",
                              backgroundColor: "var(--bg-primary)",
                              color: "var(--text-primary)",
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            value={formData[field] || ""}
                            onChange={(e) => handleChange(field, e.target.value)}
                            placeholder={`Ingresa ${label.toLowerCase()}...`}
                            className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                            style={{
                              borderColor: "var(--border-color)",
                              backgroundColor: "var(--bg-primary)",
                              color: "var(--text-primary)",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div
                  className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8 pt-6 border-t"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <button
                    onClick={() => setStep(1)}
                    className="font-medium flex items-center justify-center gap-2 transition-colors py-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <ChevronLeft size={16} /> Cambiar plantilla
                  </button>
                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      onClick={handleSaveDraft}
                      disabled={savingDraft || previewLoading}
                      className="border font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                      style={{
                        borderColor: "var(--color-primary)",
                        color: "var(--color-primary)",
                      }}
                    >
                      <Save size={16} />
                      {savingDraft ? "Guardando..." : "Guardar borrador"}
                    </button>
                    <button
                      onClick={() => handleGoToPreview()}
                      disabled={previewLoading || savingDraft}
                      className="text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {previewLoading ? (
                        "Cargando vista previa..."
                      ) : (
                        <>
                          <Eye size={16} /> Vista previa{" "}
                          <ChevronRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3 — Vista previa */}
          {step === 3 && previewHtml && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 min-w-0">
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-3 border-b"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <Eye size={14} style={{ color: "var(--color-primary)" }} />
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Vista previa — {selectedTemplate?.name}
                    </span>
                  </div>
                  <iframe
                    srcDoc={aiFields.length > 0 ? withAiMark(previewHtml) : previewHtml}
                    title="Vista previa del documento"
                    className="w-full border-0 h-[60vh] lg:h-[700px]"
                    style={{ backgroundColor: "white" }}
                  />
                </div>
              </div>

              <div className="w-full lg:w-72 flex-shrink-0">
                <div
                  className="rounded-xl border p-4 md:p-5 lg:sticky lg:top-24"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <h3
                    className="font-semibold mb-4"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Ajustes del documento
                  </h3>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon
                        size={14}
                        style={{ color: "var(--color-primary)" }}
                      />
                      <p
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Posición del logo
                      </p>
                    </div>
                    <div className="space-y-2">
                      {LOGO_POSITIONS.map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => handleLogoPositionChange(pos.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-colors text-left"
                          style={{
                            backgroundColor:
                              logoPosition === pos.id
                                ? "var(--color-primary-light)"
                                : "var(--bg-primary)",
                            borderColor:
                              logoPosition === pos.id
                                ? "var(--color-primary)"
                                : "var(--border-color)",
                            color:
                              logoPosition === pos.id
                                ? "var(--color-primary)"
                                : "var(--text-secondary)",
                            fontWeight: logoPosition === pos.id ? "600" : "400",
                          }}
                        >
                          {logoPosition === pos.id && <CheckCircle size={13} />}
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Droplets size={14} style={{ color: "var(--color-primary)" }} />
                      <p
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Marca de agua
                      </p>
                    </div>
                    <label
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border text-sm ${hasLogo ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
                      style={{
                        backgroundColor: watermark ? "var(--color-primary-light)" : "var(--bg-primary)",
                        borderColor: watermark ? "var(--color-primary)" : "var(--border-color)",
                        color: watermark ? "var(--color-primary)" : "var(--text-secondary)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={watermark}
                        disabled={!hasLogo || previewLoading}
                        onChange={(e) => handleWatermarkChange(e.target.checked)}
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                      />
                      <span>
                        Logo de fondo en todas las páginas
                        {!hasLogo && (
                          <span className="block text-xs mt-0.5">
                            Sube el logo de tu institución para usarla.
                          </span>
                        )}
                      </span>
                    </label>
                  </div>
                  <div
                    className="rounded-lg p-3 mb-6 text-xs"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    💡 Las firmas se podrán configurar próximamente desde{" "}
                    <strong>Configuración → Firmas</strong>.
                  </div>
                  {aiFields.length > 0 && (
                    <label
                      className="flex items-start gap-2 p-3 rounded-lg border mb-3 cursor-pointer text-xs"
                      style={{ backgroundColor: "#fffbeb", borderColor: "#f59e0b", color: "#92400e" }}
                    >
                      <input
                        type="checkbox"
                        checked={aiReviewed}
                        onChange={(e) => setAiReviewed(e.target.checked)}
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                      />
                      <span>
                        Revisé y corregí el texto sugerido por EduBot (
                        {aiFields.map((f) => (FIELD_LABELS[f] || f).toLowerCase()).join(", ")}) y
                        confirmo que corresponde a lo ocurrido.
                      </span>
                    </label>
                  )}
                  <button
                    onClick={handleCreate}
                    disabled={loading || (aiFields.length > 0 && !aiReviewed)}
                    className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-40 mb-2"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {loading ? (
                      "Generando..."
                    ) : (
                      <>
                        <CheckCircle size={16} /> Generar documento
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-2.5 rounded-lg text-sm font-medium border transition-colors"
                    style={{
                      borderColor: "var(--border-color)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <ChevronLeft size={14} className="inline mr-1" />
                    Volver a editar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Paso 4 — Descarga */}
          {step === 4 && createdDoc && (
            <div
              className="rounded-2xl border p-6 md:p-12 text-center"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                ¡Documento creado!
              </h2>
              <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
                {selectedTemplate?.name}
              </p>
              <p
                className="text-xs font-mono mb-8"
                style={{ color: "var(--text-secondary)" }}
              >
                ID: {createdDoc.id}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {downloading ? (
                    "Generando PDF..."
                  ) : (
                    <>
                      <Download size={18} /> Descargar PDF
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate("/documentos")}
                  className="border font-semibold py-3 px-8 rounded-lg transition-colors"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                >
                  Ver historial
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedTemplate(null);
                    setFormData({});
                    setCreatedDoc(null);
                    setPreviewHtml("");
                    resetLogoOptions();
                    setError("");
                    setNotice("");
                    setDraftId(null);
                    setAiFields([]);
                    setAiReviewed(false);
                    setAiNotes("");
                    setSearchParams({});
                  }}
                  className="font-medium hover:underline py-3 px-4"
                  style={{ color: "var(--color-primary)" }}
                >
                  Generar otro
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {lockedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-sm rounded-2xl shadow-xl p-6 text-center"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <Lock size={20} className="text-amber-600" />
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              {lockedTemplate.name}
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Este documento no está incluido en tu plan actual. Mejora tu plan para
              generarlo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLockedTemplate(null)}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg border"
                style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              >
                Cerrar
              </button>
              <button
                onClick={() => navigate("/suscripcion")}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Ver planes
              </button>
            </div>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div
            className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl p-5 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--color-sidebar)" }}
                >
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    Redactar con EduBot
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {selectedTemplate?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !aiLoading && setShowAiModal(false)}
                className="p-1"
                style={{ color: "var(--text-secondary)" }}
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-secondary)" }}>
              Campos a redactar
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {aiDraftable.map((f) => {
                const active = aiSelected.includes(f.name);
                return (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => toggleAiField(f.name)}
                    className="text-xs px-3 py-1.5 rounded-full border font-medium flex items-center gap-1"
                    style={{
                      borderColor: active ? "var(--color-primary)" : "var(--border-color)",
                      backgroundColor: active ? "var(--color-primary-light)" : "transparent",
                      color: active ? "var(--color-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {active && <CheckCircle size={12} />}
                    {f.label}
                    {!isEmptyValue(formData[f.name]) && " (mejorar)"}
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-secondary)" }}>
              Tus notas
            </p>
            <textarea
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              rows={7}
              maxLength={4000}
              placeholder={
                ["LR003", "LR004"].includes(selectedTemplate?.document_type)
                  ? "Ej.: Se revisó el calendario del segundo semestre. El rector presentó los resultados de deserción (12 %). Se acordó hacer tutorías los sábados y que la coordinación académica envíe un informe en noviembre."
                  : "Ej.: Somos una institución de Medellín que forma técnicos laborales en salud y sistemas, con énfasis en prácticas en empresas y en población vulnerable…"
              }
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
              }}
            />
            <p className="text-xs mt-1 mb-3 text-right" style={{ color: "var(--text-secondary)" }}>
              {aiNotes.length} / 4000
            </p>

            <div
              className="text-xs rounded-lg p-3 mb-4 flex gap-2"
              style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" }}
            >
              <Lock size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                No escribas nombres, documentos ni teléfonos de estudiantes: habla de cargos («el rector»,
                «los formadores»). Los números largos y correos se quitan antes de enviar. EduBot solo usa
                tus notas: lo que no le digas lo marcará como [COMPLETAR].
              </span>
            </div>

            {aiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span className="flex-1">{aiError}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setShowAiModal(false)}
                disabled={aiLoading}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg border"
                style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAiDraft}
                disabled={aiLoading || aiSelected.length === 0}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {aiLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Redactando...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} /> Redactar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <EduBot />

      {showLogout && (
        <LogoutModal
          onConfirm={() => {
            logout();
            navigate("/");
          }}
          onCancel={() => setShowLogout(false)}
        />
      )}
      {showInactivity && (
        <InactivityModal
          onContinue={() => setShowInactivity(false)}
          onLogout={() => {
            setShowInactivity(false);
            logout();
            navigate("/");
          }}
        />
      )}
      {limitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div className="flex justify-center mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary-light)" }}
              >
                <TrendingUp
                  size={26}
                  style={{ color: "var(--color-primary)" }}
                />
              </div>
            </div>
            <h3
              className="text-lg font-bold text-center mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Límite del plan alcanzado
            </h3>
            <p
              className="text-sm text-center mb-5"
              style={{ color: "var(--text-secondary)" }}
            >
              Has usado{" "}
              <span
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {limitModal.used} de {limitModal.limit} documentos
              </span>{" "}
              permitidos este mes.
            </p>
            <div
              className="w-full rounded-full h-2 mb-5"
              style={{ backgroundColor: "var(--bg-primary)" }}
            >
              <div
                className="h-2 rounded-full"
                style={{ width: "100%", backgroundColor: "#dc2626" }}
              />
            </div>
            <button
              onClick={() => {
                setLimitModal(null);
                navigate("/suscripcion");
              }}
              className="w-full py-2.5 text-sm font-semibold text-white rounded-lg mb-2 flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Crown size={15} /> Mejorar mi plan
            </button>
            <button
              onClick={() => setLimitModal(null)}
              className="w-full py-2.5 text-sm font-medium rounded-lg border"
              style={{
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-primary)",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
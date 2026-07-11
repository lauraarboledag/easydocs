import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import Sidebar from "../components/layout/Sidebar";
import EduBot from "../components/EduBot";
import useInactivity from "../hooks/useInactivity";
import InactivityModal from "../components/InactivityModal";
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

// Inyecta el estilo de posición del logo directamente en el HTML renderizado
function injectLogoPosition(html, position) {
  const alignMap = {
    "top-left": "left",
    "top-center": "center",
    "top-right": "right",
  };
  const align = alignMap[position] || "left";
  return html.replace(
    /<img([^>]*style=")([^"]*)"([^>]*)>/,
    `<img$1$2; display:block; margin-left:${align === "left" ? "0" : "auto"}; margin-right:${align === "right" ? "0" : "auto"};"$3>`,
  );
}

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

  // Estado vista previa
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [logoPosition, setLogoPosition] = useState("top-left");

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

  useInactivity({
    timeout: 30,
    onWarning: () => setShowInactivity(true),
    onLogout: () => {
      setShowInactivity(false);
      logout();
      navigate("/");
    },
  });

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    const initial = {};
    template.required_fields.forEach((f) => {
      initial[f] = "";
    });
    setFormData(initial);
    setStep(2);
    setError("");
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  // Paso 2 → 3: validar y cargar vista previa
  const handleGoToPreview = async (position = logoPosition) => {
    console.log("handleGoToPreview ejecutado", selectedTemplate?.id, formData);
    const empty = selectedTemplate.required_fields.filter((f) => !formData[f]);
    if (empty.length > 0) {
      setError(
        `Completa los campos obligatorios: ${empty.map((f) => FIELD_LABELS[f] || f).join(", ")}`,
      );
      return;
    }
    console.log("Campos completos, llamando preview...");
    setPreviewLoading(true);
    setError("");
    try {
      const res = await api.post(`/templates/${selectedTemplate.id}/preview`, {
        document_data: formData,
        logo_position: position,
      });
      console.log("Preview response:", res.data);
      setPreviewHtml(res.data.html);
      setStep(3);
    } catch (err) {
      console.error("Preview error:", err);
      setError("Error cargando la vista previa. Intenta de nuevo.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleLogoPositionChange = async (position) => {
    setLogoPosition(position);
    setPreviewLoading(true);
    try {
      const res = await api.post(`/templates/${selectedTemplate.id}/preview`, {
        document_data: formData,
        logo_position: position,
      });
      setPreviewHtml(res.data.html);
    } catch {
      setError("Error actualizando la vista previa.");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Paso 3 → 4: crear documento real
  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await api.post("/documents/", {
        template_id: selectedTemplate.id,
        document_data: formData,
      });
      setCreatedDoc(res.data);
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
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {loading && <RocketAnimation />}

      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="ml-56 flex-1 flex flex-col">
        <header
          className="border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                step === 1 ? navigate("/documentos") : setStep(step - 1)
              }
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Nuevo documento
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {step === 1 && "Selecciona el tipo de documento"}
                {step === 2 && selectedTemplate?.name}
                {step === 3 && "Revisa tu documento antes de generarlo"}
                {step === 4 && "Documento generado"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2" style={{ color: "var(--text-secondary)" }}>
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-8">
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
                    className="mx-1"
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
                {Object.keys(CHAPTER_GROUPS).map((chapter) => (
                  <button
                    key={chapter}
                    onClick={() => setActiveChapter(chapter)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor:
                        activeChapter === chapter
                          ? "var(--color-primary)"
                          : "transparent",
                      color:
                        activeChapter === chapter
                          ? "#ffffff"
                          : "var(--text-secondary)",
                    }}
                  >
                    {chapter.includes("LR") ? (
                      <BookOpen size={14} />
                    ) : (
                      <Award size={14} />
                    )}
                    <span className="hidden sm:block">
                      {chapter.includes("LR")
                        ? "Libros Reglamentarios"
                        : "Certificados y Constancias"}
                    </span>
                    <span className="sm:hidden">
                      {chapter.includes("LR") ? "Capítulo I" : "Capítulo II"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getTemplatesByChapter(CHAPTER_GROUPS[activeChapter]).map(
                  (template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
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
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--color-primary)" }}
                          >
                            {template.required_fields.length} campos requeridos
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        style={{ color: "var(--text-secondary)" }}
                        className="flex-shrink-0"
                      />
                    </button>
                  ),
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
                className="rounded-xl border p-6"
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
                  Los datos de tu institución se incluirán automáticamente.
                  Completa los campos específicos.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedTemplate.required_fields.map((field) => {
                    const isMultiline = MULTILINE_FIELDS.includes(field);
                    const label = FIELD_LABELS[field] || field;
                    return (
                      <div
                        key={field}
                        className={isMultiline ? "md:col-span-2" : ""}
                      >
                        <label
                          className="block text-xs font-semibold uppercase tracking-wide mb-1"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {label} *
                        </label>
                        {isMultiline ? (
                          <textarea
                            value={formData[field] || ""}
                            onChange={(e) =>
                              handleChange(field, e.target.value)
                            }
                            rows={3}
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
                            onChange={(e) =>
                              handleChange(field, e.target.value)
                            }
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
                  className="flex justify-between mt-8 pt-6 border-t"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <button
                    onClick={() => setStep(1)}
                    className="font-medium flex items-center gap-2 transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <ChevronLeft size={16} /> Cambiar plantilla
                  </button>
                  <button
                    onClick={() => handleGoToPreview()}
                    disabled={previewLoading}
                    className="text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-40"
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
          )}

          {/* Paso 3 — Vista previa */}
          {step === 3 && previewHtml && (
            <div className="flex gap-6">
              {/* iframe con el documento */}
              <div className="flex-1">
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
                    srcDoc={previewHtml}
                    title="Vista previa del documento"
                    className="w-full border-0"
                    style={{ height: "700px", backgroundColor: "white" }}
                  />
                </div>
              </div>

              {/* Panel de ajustes */}
              <div className="w-72 flex-shrink-0">
                <div
                  className="rounded-xl border p-5 sticky top-24"
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

                  {/* Posición del logo */}
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

                  {/* Botones */}
                  <button
                    onClick={handleCreate}
                    disabled={loading}
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
              className="rounded-2xl border p-12 text-center"
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
                    setLogoPosition("top-left");
                    setError("");
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

import TemplateBlockEditor from "../components/admin/templateEditor/TemplateBlockEditor";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import AdminSidebar from "../components/layout/AdminSidebar";
import useInactivity from "../hooks/useInactivity";
import InactivityModal from "../components/InactivityModal";
import {
  FileText,
  Bell,
  ChevronLeft,
  Plus,
  Edit2,
  Shield,
  CheckCircle,
  X,
  AlertCircle,
  Save,
  Code,
  Eye,
} from "lucide-react";

const DOCUMENT_TYPES = [
  { value: "LR001", label: "LR001 — Proyecto Educativo Institucional" },
  { value: "LR002", label: "LR002 — Libro de Matrículas" },
  { value: "LR003", label: "LR003 — Actas de Participación Comunitaria" },
  { value: "LR004", label: "LR004 — Actas Pedagógicas y Disciplinarias" },
  { value: "LR005", label: "LR005 — Registro de Certificados de Aptitud" },
  { value: "LR006", label: "LR006 — Autoevaluación Institucional" },
  { value: "LR007", label: "LR007 — Reconocimiento de Saberes Previos" },
  { value: "LR008", label: "LR008 — Registro de Calificaciones Definitivas" },
  { value: "LR009", label: "LR009 — Registros Especiales (Duplicados)" },
  {
    value: "certificado_aptitud_laboral",
    label: "Certificado de Aptitud Ocupacional — Laboral",
  },
  {
    value: "certificado_aptitud_salud",
    label: "Certificado de Aptitud Ocupacional — Salud",
  },
  {
    value: "certificado_conocimientos",
    label: "Certificado de Conocimientos Académicos",
  },
  { value: "constancia_asistencia", label: "Constancia de Asistencia" },
  { value: "constancia_estudio", label: "Constancia o Certificado de Estudio" },
];

const VARIABLES = [
  { label: "Nombre institución", value: "{{ institucion.nombre }}" },
  { label: "Municipio", value: "{{ institucion.municipio }}" },
  { label: "Departamento", value: "{{ institucion.departamento }}" },
  { label: "Licencia", value: "{{ institucion.licencia }}" },
  { label: "Email institución", value: "{{ institucion.email }}" },
  { label: "Teléfono institución", value: "{{ institucion.telefono }}" },
  { label: "Nombre estudiante", value: "{{ nombre_estudiante }}" },
  { label: "Documento estudiante", value: "{{ documento_estudiante }}" },
  { label: "Lugar expedición", value: "{{ lugar_expedicion }}" },
  { label: "Nombre programa", value: "{{ nombre_programa }}" },
  { label: "Total horas", value: "{{ total_horas }}" },
  { label: "Número acta", value: "{{ numero_acta }}" },
  { label: "Día", value: "{{ dia }}" },
  { label: "Mes", value: "{{ mes }}" },
  { label: "Año", value: "{{ anio }}" },
];

const EMPTY_FORM = {
  document_type: "",
  name: "",
  description: "",
  template_html: "",
  required_fields: [],
};

// Reemplaza variables Jinja2 con valores de ejemplo para la vista previa
function renderPreview(html) {
  return html
    .replace(/\{\{\s*institucion\.nombre\s*\}\}/g, "Instituto Técnico Ejemplo")
    .replace(/\{\{\s*institucion\.municipio\s*\}\}/g, "Medellín")
    .replace(/\{\{\s*institucion\.departamento\s*\}\}/g, "Antioquia")
    .replace(/\{\{\s*institucion\.licencia\s*\}\}/g, "Resolución 001 de 2024")
    .replace(/\{\{\s*institucion\.email\s*\}\}/g, "contacto@instituto.edu.co")
    .replace(/\{\{\s*institucion\.telefono\s*\}\}/g, "+57 300 000 0000")
    .replace(/\{\{\s*nombre_estudiante\s*\}\}/g, "María García López")
    .replace(/\{\{\s*documento_estudiante\s*\}\}/g, "1234567890")
    .replace(/\{\{\s*tipo_documento\s*\}\}/g, "CC")
    .replace(/\{\{\s*lugar_expedicion\s*\}\}/g, "Medellín")
    .replace(/\{\{\s*nombre_programa\s*\}\}/g, "Auxiliar de Enfermería")
    .replace(/\{\{\s*total_horas\s*\}\}/g, "1440")
    .replace(/\{\{\s*resolucion_programa\s*\}\}/g, "Resolución 002 de 2024")
    .replace(/\{\{\s*numero_matricula\s*\}\}/g, "001")
    .replace(/\{\{\s*folio\s*\}\}/g, "01")
    .replace(/\{\{\s*numero_acta\s*\}\}/g, "005")
    .replace(/\{\{\s*nombre_director\s*\}\}/g, "Juan Pérez Rodríguez")
    .replace(/\{\{\s*dia\s*\}\}/g, "15")
    .replace(/\{\{\s*mes\s*\}\}/g, "junio")
    .replace(/\{\{\s*anio\s*\}\}/g, "2026")
    .replace(
      /\{\{[^}]+\}\}/g,
      '<span style="background:#dbeafe;color:#1d4ed8;padding:1px 4px;border-radius:3px;font-size:11px">[campo]</span>',
    )
    .replace(/\{%[^%]+%\}/g, "");
}

export default function AdminTemplates() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null); // 'view' | 'edit' | 'create'
  const [viewTab, setViewTab] = useState("preview"); // 'preview' | 'html'
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldsInput, setFieldsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);

  useInactivity({
    timeout: 30,
    onWarning: () => setShowInactivity(true),
    onLogout: () => {
      setShowInactivity(false);
      logout();
      navigate("/");
    },
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get("/templates/");
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (template) => {
    try {
      const res = await api.get(`/templates/${template.id}`);
      const full = res.data;
      setSelected(full);
      setForm({
        document_type: full.document_type || "",
        name: full.name || "",
        description: full.description || "",
        template_html: full.template_html || "",
        required_fields: Array.isArray(full.required_fields)
          ? full.required_fields
          : [],
      });
      setFieldsInput(
        Array.isArray(full.required_fields)
          ? full.required_fields.join(", ")
          : "",
      );
      setMode("view");
      setViewTab("preview");
      setError("");
    } catch (err) {
      setError("Error al cargar la plantilla.");
    }
  };

  const handleCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setFieldsInput("");
    setMode("create");
    setError("");
  };

  const handleFieldsChange = (val) => {
    setFieldsInput(val);
    setForm((p) => ({
      ...p,
      required_fields: val
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
    }));
  };

  const insertVariable = (variable) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal =
      form.template_html.substring(0, start) +
      variable +
      form.template_html.substring(end);
    setForm((p) => ({ ...p, template_html: newVal }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const handleSave = async () => {
    if (!form.name || !form.document_type || !form.template_html) {
      setError("Nombre, tipo de documento y contenido HTML son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        await api.post("/templates/", form);
        setSuccess("Plantilla creada exitosamente.");
      } else {
        await api.put(`/templates/${selected.id}`, form);
        setSuccess("Plantilla actualizada exitosamente.");
      }
      await fetchTemplates();
      setMode(null);
      setSelected(null);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (selected) handleSelect(selected);
    else setMode(null);
    setError("");
  };

  const isEditing = mode === "edit" || mode === "create";

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <AdminSidebar onLogout={() => setShowLogout(true)} />

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
              onClick={() => navigate("/admin")}
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
                Plantillas
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Editor de plantillas reglamentarias
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2" style={{ color: "var(--text-secondary)" }}>
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Shield size={14} className="text-white" />
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

        <div className="flex-1 p-8 flex gap-6">
          {/* Lista plantillas */}
          <div className="w-72 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {templates.length} plantillas
              </h2>
              <button
                onClick={handleCreate}
                className="text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Plus size={14} /> Nueva
              </button>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-3 text-xs flex items-center gap-2">
                <CheckCircle size={14} /> {success}
              </div>
            )}

            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
              {loading ? (
                <div
                  className="text-center py-8 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cargando...
                </div>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={{
                      backgroundColor:
                        selected?.id === template.id
                          ? "var(--color-primary-light)"
                          : "var(--bg-secondary)",
                      borderColor:
                        selected?.id === template.id
                          ? "var(--color-primary)"
                          : "var(--border-color)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--color-primary-light)" }}
                    >
                      <FileText
                        size={14}
                        style={{ color: "var(--color-icon)" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {template.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {template.required_fields.length} campos
                      </p>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${template.is_active ? "bg-green-400" : "bg-gray-300"}`}
                    />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Panel editor */}
          <div className="flex-1 min-w-0">
            {!mode && !selected ? (
              <div
                className="rounded-xl border h-full flex items-center justify-center"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: "var(--bg-primary)" }}
                  >
                    <FileText
                      size={32}
                      style={{ color: "var(--text-secondary)", opacity: 0.4 }}
                    />
                  </div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Selecciona una plantilla
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    o crea una nueva
                  </p>
                  <button
                    onClick={handleCreate}
                    className="mt-4 text-sm font-medium hover:underline"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Crear plantilla →
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl border flex flex-col"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between p-4 border-b"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <h3
                    className="font-bold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {mode === "create"
                      ? "Nueva plantilla"
                      : mode === "edit"
                        ? `Editando: ${selected?.name}`
                        : selected?.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {mode === "view" && (
                      <button
                        onClick={() => setMode("edit")}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                    )}
                    {isEditing && (
                      <>
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg font-medium transition-colors"
                          style={{
                            borderColor: "var(--border-color)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <X size={13} /> Cancelar
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-xs text-white px-4 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        >
                          <Save size={13} />{" "}
                          {saving ? "Guardando..." : "Guardar"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Cuerpo: dos columnas — metadatos angostos + editor a pantalla completa */}
                <div className="p-5 flex-1 overflow-y-auto flex gap-5">
                  {/* Columna izquierda — información de la plantilla, compacta */}
                  <div className="w-64 flex-shrink-0 space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle size={14} /> {error}
                      </div>
                    )}

                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Tipo *
                      </label>
                      {mode === "view" ? (
                        <p
                          className="text-sm px-3 py-2 rounded-lg"
                          style={{
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {form.document_type}
                        </p>
                      ) : (
                        <select
                          value={form.document_type}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              document_type: e.target.value,
                            }))
                          }
                          disabled={mode === "edit"}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                          style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                          }}
                        >
                          <option value="">Selecciona...</option>
                          {DOCUMENT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Nombre *
                      </label>
                      {mode === "view" ? (
                        <p
                          className="text-sm px-3 py-2 rounded-lg"
                          style={{
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {form.name}
                        </p>
                      ) : (
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, name: e.target.value }))
                          }
                          placeholder="Nombre de la plantilla"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-primary)",
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Descripción
                      </label>
                      {mode === "view" ? (
                        <p
                          className="text-sm px-3 py-2 rounded-lg"
                          style={{
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {form.description || "—"}
                        </p>
                      ) : (
                        <textarea
                          value={form.description}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Descripción normativa..."
                          rows={2}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
                          style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-primary)",
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Campos requeridos
                      </label>
                      {mode === "view" ? (
                        <div className="flex flex-wrap gap-1.5">
                          {form.required_fields.map((f) => (
                            <span
                              key={f}
                              className="text-xs px-2 py-1 rounded font-mono"
                              style={{
                                backgroundColor: "var(--color-primary-light)",
                                color: "var(--color-primary)",
                              }}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={fieldsInput}
                            onChange={(e) => handleFieldsChange(e.target.value)}
                            placeholder="nombre_estudiante, documento..."
                            className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2"
                            style={{
                              borderColor: "var(--border-color)",
                              backgroundColor: "var(--bg-primary)",
                              color: "var(--text-primary)",
                            }}
                          />
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Separados por coma.
                          </p>
                          {form.required_fields.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {form.required_fields.map((f) => (
                                <span
                                  key={f}
                                  className="text-xs px-2 py-1 rounded font-mono"
                                  style={{
                                    backgroundColor:
                                      "var(--color-primary-light)",
                                    color: "var(--color-primary)",
                                  }}
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Columna derecha — el editor, a pantalla completa */}
                  <div className="flex-1 min-w-0">
                    <label
                      className="block text-xs font-semibold uppercase tracking-wide mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {isEditing ? "Contenido" : "Vista previa"}
                    </label>

                    {mode === "view" && (
                      <div
                        className="flex gap-1 p-0.5 rounded-lg mb-2 w-fit"
                        style={{ backgroundColor: "var(--bg-primary)" }}
                      >
                        <button
                          onClick={() => setViewTab("preview")}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                          style={{
                            backgroundColor:
                              viewTab === "preview"
                                ? "var(--bg-secondary)"
                                : "transparent",
                            color:
                              viewTab === "preview"
                                ? "var(--text-primary)"
                                : "var(--text-secondary)",
                          }}
                        >
                          <Eye size={12} /> Vista previa
                        </button>
                        <button
                          onClick={() => setViewTab("html")}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                          style={{
                            backgroundColor:
                              viewTab === "html"
                                ? "var(--bg-secondary)"
                                : "transparent",
                            color:
                              viewTab === "html"
                                ? "var(--text-primary)"
                                : "var(--text-secondary)",
                          }}
                        >
                          <Code size={12} /> HTML
                        </button>
                      </div>
                    )}

                    {mode === "view" && viewTab === "preview" && (
                      <div
                        className="border rounded-xl overflow-hidden"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <iframe
                          srcDoc={renderPreview(form.template_html)}
                          className="w-full bg-white"
                          style={{ height: "650px", border: "none" }}
                          title="Vista previa plantilla"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    )}

                    {mode === "view" && viewTab === "html" && (
                      <textarea
                        readOnly
                        value={form.template_html}
                        rows={28}
                        className="w-full border rounded-lg px-4 py-3 text-xs font-mono resize-none"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-primary)",
                          color: "var(--text-primary)",
                        }}
                      />
                    )}

                    {mode === "create" && (
                      <TemplateBlockEditor variables={VARIABLES} />
                    )}

                    {mode === "edit" && (
                      <>
                        <div
                          className="border rounded-xl overflow-hidden"
                          style={{ borderColor: "var(--border-color)" }}
                        >
                          <div
                            className="px-3 py-2 border-b flex items-center justify-between"
                            style={{
                              backgroundColor: "var(--bg-primary)",
                              borderColor: "var(--border-color)",
                            }}
                          >
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Editor HTML
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {form.template_html.length} caracteres
                            </span>
                          </div>
                          <textarea
                            ref={textareaRef}
                            value={form.template_html}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                template_html: e.target.value,
                              }))
                            }
                            rows={20}
                            placeholder="<!DOCTYPE html><html>..."
                            className="w-full px-4 py-3 text-xs font-mono focus:outline-none resize-none"
                            style={{
                              backgroundColor: "var(--bg-secondary)",
                              color: "var(--text-primary)",
                            }}
                          />
                        </div>

                        {form.template_html && (
                          <div
                            className="mt-4 border rounded-xl overflow-hidden"
                            style={{ borderColor: "var(--border-color)" }}
                          >
                            <div
                              className="px-3 py-2 border-b"
                              style={{
                                backgroundColor: "var(--color-primary-light)",
                                borderColor: "var(--border-color)",
                              }}
                            >
                              <span
                                className="text-xs font-medium"
                                style={{ color: "var(--color-primary)" }}
                              >
                                Vista previa en tiempo real
                              </span>
                            </div>
                            <iframe
                              srcDoc={renderPreview(form.template_html)}
                              className="w-full bg-white"
                              style={{ height: "300px", border: "none" }}
                              title="Vista previa"
                              sandbox="allow-same-origin"
                            />
                          </div>
                        )}

                        <div
                          className="mt-2 rounded-xl p-3 border"
                          style={{
                            backgroundColor: "var(--color-primary-light)",
                            borderColor: "var(--color-primary)",
                          }}
                        >
                          <p
                            className="text-xs font-medium mb-1"
                            style={{ color: "var(--color-primary)" }}
                          >
                            Variables institucionales disponibles
                            automáticamente:
                          </p>
                          <p
                            className="text-xs font-mono leading-5"
                            style={{ color: "var(--color-primary)" }}
                          >
                            {"{{ institucion.nombre }}"} ·{" "}
                            {"{{ institucion.municipio }}"} ·{" "}
                            {"{{ institucion.departamento }}"} ·{" "}
                            {"{{ institucion.licencia }}"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

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
    </div>
  );
}
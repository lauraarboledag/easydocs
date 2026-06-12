import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import AdminSidebar from "../components/layout/AdminSidebar";
import {
  FileText,
  LayoutDashboard,
  Building2,
  CreditCard,
  ArrowLeftRight,
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  Plus,
  Edit2,
  Shield,
  MessageSquare,
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

export default function AdminTemplates() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldsInput, setFieldsInput] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [textareaRef, setTextareaRef] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

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

  const handleSelect = (template) => {
    try {
      setSelected(template);
      setForm({
        document_type: template.document_type || "",
        name: template.name || "",
        description: template.description || "",
        template_html: template.template_html || "",
        required_fields: Array.isArray(template.required_fields)
          ? template.required_fields
          : [],
      });
      setFieldsInput(
        Array.isArray(template.required_fields)
          ? template.required_fields.join(", ")
          : "",
      );
      setMode("view");
      setError("");
      setShowSource(false);
    } catch (err) {
      console.error("Error en handleSelect:", err);
    }
  };

  const handleCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setFieldsInput("");
    setMode("create");
    setError("");
    setShowSource(false);
  };

  const handleFieldsChange = (val) => {
    setFieldsInput(val);
    const fields = val
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, required_fields: fields }));
  };

  const insertVariable = (variable) => {
    if (!textareaRef) return;
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const current = form.template_html;
    const newVal =
      current.substring(0, start) + variable + current.substring(end);
    setForm((prev) => ({ ...prev, template_html: newVal }));
    setTimeout(() => {
      textareaRef.focus();
      textareaRef.setSelectionRange(
        start + variable.length,
        start + variable.length,
      );
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
    if (selected) {
      handleSelect(selected);
    } else {
      setMode(null);
    }
    setError("");
  };

  const handleLogout = () => setShowLogout(true);
  const confirmLogout = () => {
    logout();
    navigate("/");
  };

  const isEditing = mode === "edit" || mode === "create";

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar onLogout={handleLogout} />
      {/* Contenido */}
      <main className="ml-56 flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Plantillas
              </h1>
              <p className="text-xs text-gray-400">
                Editor de plantillas reglamentarias
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
              <p className="text-sm font-medium text-gray-800">
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 flex gap-6">
          {/* Lista */}
          <div className="w-72 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">
                {templates.length} plantillas
              </h2>
              <button
                onClick={handleCreate}
                className="bg-[#2952cc] hover:bg-[#1e3fa8] text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
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
                <div className="text-center py-8 text-gray-400 text-sm">
                  Cargando...
                </div>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      selected?.id === template.id
                        ? "bg-blue-50 border-[#2952cc]"
                        : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={14} className="text-[#2952cc]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {template.name}
                      </p>
                      <p className="text-xs text-gray-400">
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
              <div className="bg-white rounded-xl border border-gray-100 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Selecciona una plantilla
                  </p>
                  <p className="text-gray-400 text-sm mt-1">o crea una nueva</p>
                  <button
                    onClick={handleCreate}
                    className="mt-4 text-sm text-[#2952cc] font-medium hover:underline"
                  >
                    Crear plantilla →
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm">
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
                        className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                    )}
                    {isEditing && (
                      <>
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                          <X size={13} /> Cancelar
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-xs bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          <Save size={13} />{" "}
                          {saving ? "Guardando..." : "Guardar"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-5 flex-1 overflow-y-auto">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                      <AlertCircle size={15} /> {error}
                    </div>
                  )}

                  {/* Metadatos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Tipo *
                      </label>
                      {mode === "view" ? (
                        <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
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
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white disabled:bg-gray-50 disabled:text-gray-400"
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
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Nombre *
                      </label>
                      {mode === "view" ? (
                        <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
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
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Descripción
                    </label>
                    {mode === "view" ? (
                      <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        {form.description || "—"}
                      </p>
                    ) : (
                      <input
                        type="text"
                        value={form.description}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Descripción normativa..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                      />
                    )}
                  </div>

                  {/* Campos requeridos */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Campos requeridos
                    </label>
                    {mode === "view" ? (
                      <div className="flex flex-wrap gap-1.5">
                        {form.required_fields.map((f) => (
                          <span
                            key={f}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono"
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
                          placeholder="nombre_estudiante, documento_estudiante, fecha..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Separados por coma. Deben coincidir exactamente con
                          las variables usadas en el HTML.
                        </p>
                        {form.required_fields.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {form.required_fields.map((f) => (
                              <span
                                key={f}
                                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Editor HTML */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Contenido HTML *
                      </label>
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          {/* Insertar variable */}
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                insertVariable(e.target.value);
                                e.target.value = "";
                              }
                            }}
                            className="text-xs border border-blue-200 rounded px-2 py-1 bg-blue-50 text-blue-700 font-medium"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              + Insertar variable
                            </option>
                            {VARIABLES.map((v) => (
                              <option key={v.value} value={v.value}>
                                {v.label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => setShowSource(!showSource)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                              showSource
                                ? "bg-gray-700 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <Code size={12} />
                            {showSource ? "Vista previa" : "HTML"}
                          </button>
                        </div>
                      )}
                    </div>

                    {mode === "view" ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <FileText
                          size={32}
                          className="text-gray-300 mx-auto mb-3"
                        />
                        <p className="text-sm text-gray-500 font-medium">
                          Vista previa no disponible
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Haz clic en <strong>Editar</strong> para ver y
                          modificar el HTML. La vista previa en PDF estará
                          disponible próximamente.
                        </p>
                      </div>
                    ) : showSource ? (
                      <textarea
                        ref={(el) => setTextareaRef(el)}
                        value={form.template_html}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            template_html: e.target.value,
                          }))
                        }
                        rows={16}
                        placeholder="<!DOCTYPE html><html>..."
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2952cc] resize-none bg-gray-50"
                      />
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-blue-50 px-3 py-2 border-b border-blue-100 flex items-center justify-between">
                          <span className="text-xs text-blue-600 font-medium">
                            Editor visual — las variables se resaltan en azul
                          </span>
                          <span className="text-xs text-blue-400">
                            {form.template_html.length} caracteres
                          </span>
                        </div>
                        <textarea
                          ref={(el) => setTextareaRef(el)}
                          value={form.template_html}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              template_html: e.target.value,
                            }))
                          }
                          rows={16}
                          placeholder="Escribe o pega el HTML aquí. Usa el menú 'Insertar variable' para agregar variables Jinja2..."
                          className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
                        />
                      </div>
                    )}

                    {isEditing && (
                      <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-xs text-blue-700 font-medium mb-1">
                          Variables institucionales disponibles automáticamente:
                        </p>
                        <p className="text-xs font-mono text-blue-600 leading-5">
                          {"{{ institucion.nombre }}"} ·{" "}
                          {"{{ institucion.municipio }}"} ·{" "}
                          {"{{ institucion.departamento }}"} ·{" "}
                          {"{{ institucion.licencia }}"}
                        </p>
                        <p className="text-xs text-blue-400 mt-1">
                          Próximamente: {"{{ institucion.logo_url }}"} ·{" "}
                          {"{{ institucion.firma_url }}"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#1a2b4a] hover:bg-[#2952cc] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50">
        <MessageSquare size={22} />
      </button>
      {showLogout && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </div>
  );
}

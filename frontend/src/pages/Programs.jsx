import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Bell,
  ChevronLeft,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Download,
  Upload,
  Clock,
  FileText,
  GraduationCap,
} from "lucide-react";

const CERTIFICATE_TYPES = [
  "Técnico Laboral por Competencias",
  "Técnico Laboral en Salud",
  "Conocimientos Académicos",
  "Educación Informal",
];

const EMPTY_FORM = {
  name: "",
  resolution: "",
  total_hours: "",
  certificate_type: "",
};

const CERT_COLORS = {
  "Técnico Laboral por Competencias": {
    bg: "var(--color-primary-light)",
    color: "var(--color-primary)",
  },
  "Técnico Laboral en Salud": { bg: "#fef3c7", color: "#b45309" },
  "Conocimientos Académicos": { bg: "#f0fdf4", color: "#16a34a" },
  "Educación Informal": { bg: "#faf5ff", color: "#9333ea" },
};

export default function Programs() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
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
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await api.get("/programs/");
      setPrograms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (program = null) => {
    setEditing(program);
    setForm(
      program
        ? {
            name: program.name,
            resolution: program.resolution || "",
            total_hours: program.total_hours || "",
            certificate_type: program.certificate_type || "",
          }
        : EMPTY_FORM,
    );
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setError("El nombre del programa es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/programs/${editing.id}`, form);
        setSuccess("Programa actualizado.");
      } else {
        await api.post("/programs/", form);
        setSuccess("Programa creado.");
      }
      setShowModal(false);
      fetchPrograms();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Deseas desactivar este programa?")) return;
    try {
      await api.delete(`/programs/${id}`);
      setSuccess("Programa desactivado.");
      fetchPrograms();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get("/programs/template/xlsx", {
        responseType: "blob",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.setAttribute("download", "plantilla_programas.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/programs/export/xlsx", {
        responseType: "blob",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.setAttribute("download", "programas.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/programs/import/xlsx", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(
        `${res.data.message}${res.data.errors.length > 0 ? ` (${res.data.errors.length} errores)` : ""}`,
      );
      fetchPrograms();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError("Error al importar el archivo.");
    }
    e.target.value = "";
  };

  const certStyle = (type) =>
    CERT_COLORS[type] || {
      bg: "var(--color-primary-light)",
      color: "var(--color-primary)",
    };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="ml-56 flex-1 flex flex-col">
        {/* Topbar */}
        <header
          className="border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
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
                Programas
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Programas académicos de tu institución
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

        <div className="flex-1 p-8">
          {/* Banner paso 1 */}
          <div
            className="rounded-2xl p-6 mb-6 flex items-center gap-6"
            style={{
              background:
                "linear-gradient(to right, var(--color-banner-from), var(--color-banner-to))",
            }}
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white/70 text-xs font-medium mb-0.5">
                Paso 1 de 3 — Programas
              </p>
              <p className="text-white font-bold text-sm">
                Registra primero los programas académicos
              </p>
              <p className="text-white/70 text-xs mt-1">
                Añade resolución, horas y tipo de certificado. Luego vincula
                estudiantes y genera matrículas.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-4 text-white/60 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                  1
                </div>
                <span className="text-white font-medium">Programas</span>
              </div>
              <div className="w-8 h-px bg-white/30" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                Estudiantes
              </div>
              <div className="w-8 h-px bg-white/30" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                Matrículas
              </div>
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <CheckCircle size={16} /> {success}
            </div>
          )}

          {/* Header acciones */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Programas registrados
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {programs.length} programa{programs.length !== 1 ? "s" : ""}{" "}
                activo{programs.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="border font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <Download size={16} /> Plantilla xlsx
              </button>
              <label
                className="border font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm cursor-pointer"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <Upload size={16} /> Importar xlsx
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExport}
                className="border font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <Download size={16} /> Exportar
              </button>
              <button
                onClick={() => handleOpen()}
                className="text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Plus size={18} /> Nuevo programa
              </button>
            </div>
          </div>

          {/* Contenido */}
          {loading ? (
            <div
              className="text-center py-16 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Cargando...
            </div>
          ) : programs.length === 0 ? (
            <div
              className="rounded-xl border text-center py-16"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "var(--bg-primary)" }}
              >
                <BookOpen
                  size={32}
                  style={{ color: "var(--text-secondary)", opacity: 0.4 }}
                />
              </div>
              <p
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Sin programas aún
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Crea el primer programa académico de tu institución
              </p>
              <button
                onClick={() => handleOpen()}
                className="mt-4 text-sm font-medium hover:underline"
                style={{ color: "var(--color-primary)" }}
              >
                Crear programa →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((program) => {
                const style = certStyle(program.certificate_type);
                return (
                  <div
                    key={program.id}
                    className="rounded-xl border p-5 transition-all hover:shadow-sm"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: style.bg }}
                      >
                        <BookOpen size={18} style={{ color: style.color }} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpen(program)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color =
                              "var(--color-primary)";
                            e.currentTarget.style.backgroundColor =
                              "var(--color-primary-light)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color =
                              "var(--text-secondary)";
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(program.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#dc2626";
                            e.currentTarget.style.backgroundColor = "#fee2e2";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color =
                              "var(--text-secondary)";
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3
                      className="font-semibold text-sm mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {program.name}
                    </h3>

                    {program.certificate_type && (
                      <span
                        className="inline-block text-xs px-2.5 py-1 rounded-full font-medium mb-3"
                        style={{
                          backgroundColor: style.bg,
                          color: style.color,
                        }}
                      >
                        {program.certificate_type}
                      </span>
                    )}

                    <div
                      className="space-y-1.5 pt-3 border-t"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      {program.total_hours && (
                        <div className="flex items-center gap-2">
                          <Clock
                            size={12}
                            style={{ color: "var(--text-secondary)" }}
                          />
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <span
                              className="font-medium"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Horas:
                            </span>{" "}
                            {program.total_hours}
                          </p>
                        </div>
                      )}
                      {program.resolution && (
                        <div className="flex items-center gap-2">
                          <FileText
                            size={12}
                            style={{ color: "var(--text-secondary)" }}
                          />
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <span
                              className="font-medium"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Resolución:
                            </span>{" "}
                            {program.resolution}
                          </p>
                        </div>
                      )}
                    </div>

                    <div
                      className="mt-3 pt-3 border-t flex gap-2"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <button
                        onClick={() =>
                          navigate(`/estudiantes?program_id=${program.id}`)
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg transition-colors font-medium"
                        style={{
                          color: "var(--color-primary)",
                          backgroundColor: "var(--color-primary-light)",
                        }}
                      >
                        <GraduationCap size={12} /> Estudiantes
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/matriculas?program_id=${program.id}`)
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg transition-colors font-medium"
                        style={{
                          color: "var(--text-secondary)",
                          backgroundColor: "var(--bg-primary)",
                        }}
                      >
                        <FileText size={12} /> Matrículas
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl w-full max-w-md"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <h3
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {editing ? "Editar programa" : "Nuevo programa"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Nombre del programa *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    setError("");
                  }}
                  placeholder="Ej: Auxiliar de Enfermería"
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Tipo de certificado
                </label>
                <select
                  value={form.certificate_type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, certificate_type: e.target.value }))
                  }
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Selecciona...</option>
                  {CERTIFICATE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Total horas
                  </label>
                  <input
                    type="text"
                    value={form.total_hours}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, total_hours: e.target.value }))
                    }
                    placeholder="Ej: 1440"
                    className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    N° Resolución
                  </label>
                  <input
                    type="text"
                    value={form.resolution}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, resolution: e.target.value }))
                    }
                    placeholder="Ej: 001 de 2024"
                    className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border font-medium py-3 rounded-lg transition-colors"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Save size={16} />
                  {saving
                    ? "Guardando..."
                    : editing
                      ? "Actualizar"
                      : "Crear programa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

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
  Shield,
  ChevronLeft,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Download,
  Upload,
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

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="ml-56 flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Programas</h1>
              <p className="text-xs text-gray-400">
                Programas académicos de tu institución
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2952cc] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-[#2952cc] flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-1">
              Paso 1 de 3 — Programas
            </p>
            <p className="text-xs text-blue-600">
              Los programas son el punto de partida. Regístralos primero con su
              resolución, horas y tipo de certificado. Luego podrás vincular
              estudiantes y generar matrículas. Para importar masivamente
              descarga la <strong>Plantilla xlsx</strong> de EasyDocs.
            </p>
          </div>
        </div>

        <div className="flex-1 p-8">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <CheckCircle size={16} /> {success}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Programas registrados
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {programs.length} programa{programs.length !== 1 ? "s" : ""}{" "}
                activo{programs.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="border border-gray-200 hover:border-gray-300 text-gray-600 font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
              >
                <Download size={16} /> Plantilla xlsx
              </button>
              <label className="border border-gray-200 hover:border-gray-300 text-gray-600 font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm cursor-pointer">
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
                className="border border-gray-200 hover:border-gray-300 text-gray-600 font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
              >
                <Download size={16} /> Exportar
              </button>
              <button
                onClick={() => handleOpen()}
                className="bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={18} /> Nuevo programa
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              Cargando...
            </div>
          ) : programs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Sin programas aún</p>
              <p className="text-gray-400 text-sm mt-1">
                Crea el primer programa académico de tu institución
              </p>
              <button
                onClick={() => handleOpen()}
                className="mt-4 text-sm text-[#2952cc] font-medium hover:underline"
              >
                Crear programa →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen size={18} className="text-[#2952cc]" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpen(program)}
                        className="p-1.5 text-gray-400 hover:text-[#2952cc] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(program.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    {program.name}
                  </h3>
                  {program.certificate_type && (
                    <p className="text-xs text-blue-600 mb-2">
                      {program.certificate_type}
                    </p>
                  )}
                  <div className="space-y-1 mt-3 pt-3 border-t border-gray-50">
                    {program.total_hours && (
                      <p className="text-xs text-gray-400">
                        <span className="font-medium text-gray-600">
                          Horas:
                        </span>{" "}
                        {program.total_hours}
                      </p>
                    )}
                    {program.resolution && (
                      <p className="text-xs text-gray-400">
                        <span className="font-medium text-gray-600">
                          Resolución:
                        </span>{" "}
                        {program.resolution}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex gap-2">
                    <button
                      onClick={() =>
                        navigate(`/estudiantes?program_id=${program.id}`)
                      }
                      className="flex-1 text-xs text-center text-[#2952cc] hover:bg-blue-50 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      Ver estudiantes
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/matriculas?program_id=${program.id}`)
                      }
                      className="flex-1 text-xs text-center text-gray-600 hover:bg-gray-50 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      Matrículas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal crear/editar programa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editing ? "Editar programa" : "Nuevo programa"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
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
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Tipo de certificado
                </label>
                <select
                  value={form.certificate_type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, certificate_type: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Total horas
                  </label>
                  <input
                    type="text"
                    value={form.total_hours}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, total_hours: e.target.value }))
                    }
                    placeholder="Ej: 1440"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    N° Resolución
                  </label>
                  <input
                    type="text"
                    value={form.resolution}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, resolution: e.target.value }))
                    }
                    placeholder="Ej: 001 de 2024"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
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

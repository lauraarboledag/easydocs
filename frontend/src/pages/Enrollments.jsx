import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import {
  ClipboardList,
  Plus,
  Trash2,
  Bell,
  ChevronLeft,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Download,
  FileText,
  UserCircle,
  GraduationCap,
} from "lucide-react";

const EMPTY_FORM = {
  student_id: "",
  program_id: "",
  enrollment_number: "",
  folio: "",
  certificate_type: "",
  year: new Date().getFullYear().toString(),
};

export default function Enrollments() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programIdFilter = searchParams.get("program_id");

  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(programIdFilter || "");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLR002Modal, setShowLR002Modal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [lr002Data, setLr002Data] = useState({});

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
    fetchData();
  }, []);
  useEffect(() => {
    fetchEnrollments();
  }, [selectedProgram]);

  const fetchData = async () => {
    try {
      const [studentsRes, programsRes, templatesRes] = await Promise.all([
        api.get("/students/"),
        api.get("/programs/"),
        api.get("/templates/"),
      ]);
      // Ordenar estudiantes alfabéticamente
      const sortedStudents = [...studentsRes.data].sort((a, b) =>
        a.full_name.localeCompare(b.full_name, "es"),
      );
      setStudents(sortedStudents);
      setPrograms(programsRes.data);
      setTemplates(templatesRes.data);
    } catch (err) {
      setError("Error al mostrar estudiantes. Intenta de nuevo más tarde")
    }
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const url = selectedProgram
        ? `/enrollments/?program_id=${selectedProgram}`
        : "/enrollments/";
      const res = await api.get(url);
      // Ordenar matrículas por nombre de estudiante
      const sorted = [...res.data].sort((a, b) =>
        a.student.full_name.localeCompare(b.student.full_name, "es"),
      );
      setEnrollments(sorted);
    } catch (err) {
      setError("Error al mostrar matrículas. Intenta de nuevo más tarde");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setForm({ ...EMPTY_FORM, program_id: selectedProgram || "" });
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.program_id) {
      setError("Estudiante y programa son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/enrollments/", form);
      setSuccess("Matrícula registrada exitosamente.");
      setShowModal(false);
      fetchEnrollments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Deseas cancelar esta matrícula?")) return;
    try {
      await api.delete(`/enrollments/${id}`);
      setSuccess("Matrícula cancelada.");
      fetchEnrollments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Error al cancelar. Intenta de nuevo más tarde");
    }
  };

  const handleExportXlsx = async () => {
    try {
      const url = selectedProgram
        ? `/enrollments/export/xlsx?program_id=${selectedProgram}`
        : "/enrollments/export/xlsx";
      const res = await api.get(url, { responseType: "blob" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.setAttribute(
        "download",
        `matriculas_${selectedProgram || "todos"}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Error al expotar. Intenta de nuevo más tarde");
    }
  };

  const handleGenerateLR002 = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setLr002Data({
      nombre_estudiante: enrollment.student.full_name,
      tipo_documento: enrollment.student.document_type,
      documento_estudiante: enrollment.student.document_number,
      lugar_expedicion: enrollment.student.document_place || "",
      direccion: enrollment.student.address || "",
      barrio: enrollment.student.neighborhood || "",
      comuna: enrollment.student.commune || "",
      telefono_estudiante: enrollment.student.phone || "",
      nombre_programa: enrollment.program.name,
      tipo_certificado:
        enrollment.certificate_type ||
        enrollment.program.certificate_type ||
        "",
      numero_matricula: enrollment.enrollment_number || "",
      folio: enrollment.folio || "",
      dia: new Date().getDate().toString(),
      mes: new Date().toLocaleString("es-CO", { month: "long" }),
      anio: enrollment.year || new Date().getFullYear().toString(),
    });
    setShowLR002Modal(true);
  };

  const handleDownloadLR002 = async () => {
    const lr002Template = templates.find((t) => t.document_type === "LR002");
    if (!lr002Template) {
      setError("No se encontró la plantilla LR002.");
      return;
    }
    setDownloading(true);
    try {
      const docRes = await api.post("/documents/", {
        template_id: lr002Template.id,
        document_data: lr002Data,
      });
      const pdfRes = await api.get(`/documents/${docRes.data.id}/pdf`, {
        responseType: "blob",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(
        new Blob([pdfRes.data], { type: "application/pdf" }),
      );
      link.setAttribute(
        "download",
        `LR002_${selectedEnrollment.student.full_name}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowLR002Modal(false);
      setSuccess("LR002 generado exitosamente.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Error al generar el LR002.");
    } finally {
      setDownloading(false);
    }
  };

  const filtered = enrollments.filter(
    (e) =>
      e.student.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.student.document_number.includes(search),
  );

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
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
              onClick={() => navigate("/programas")}
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
                Matrículas
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Registro de matrículas por programa
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
          {/* Banner paso 3 */}
          <div
            className="rounded-2xl p-5 mb-6 flex items-start gap-4"
            style={{
              backgroundColor: "var(--color-primary-light)",
              border: "1px solid var(--color-primary)",
              borderOpacity: 0.2,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <p
                className="text-xs font-semibold mb-0.5"
                style={{ color: "var(--color-primary)" }}
              >
                Paso 3 de 3 — Matrículas
              </p>
              <p className="text-xs" style={{ color: "var(--text-primary)" }}>
                Vincula estudiantes con programas. Cada matrícula genera
                automáticamente el <strong>LR002</strong> con los datos
                precargados. Recuerda: primero registra el{" "}
                <strong>Programa</strong> y luego el <strong>Estudiante</strong>
                .
              </p>
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
                Matrículas registradas
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {filtered.length} matrícula{filtered.length !== 1 ? "s" : ""} —
                orden alfabético
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportXlsx}
                className="border font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <Download size={16} /> Exportar xlsx
              </button>
              <button
                onClick={handleOpen}
                className="text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Plus size={18} /> Nueva matrícula
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div
            className="rounded-xl border p-4 mb-6 flex gap-3"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-secondary)" }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} style={{ color: "var(--text-secondary)" }} />
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="">Todos los programas</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div
            className="rounded-xl border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            {loading ? (
              <div
                className="text-center py-16 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Cargando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  <ClipboardList
                    size={32}
                    style={{ color: "var(--text-secondary)", opacity: 0.4 }}
                  />
                </div>
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Sin matrículas aún
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Registra la primera matrícula
                </p>
                <button
                  onClick={handleOpen}
                  className="mt-4 text-sm font-medium hover:underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  Nueva matrícula →
                </button>
              </div>
            ) : (
              <>
                <div
                  className="grid grid-cols-12 text-xs uppercase tracking-wide px-6 py-3 border-b"
                  style={{
                    color: "var(--text-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <span className="col-span-3">Estudiante</span>
                  <span className="col-span-3">Programa</span>
                  <span className="col-span-2">N° Matrícula</span>
                  <span className="col-span-2">Año</span>
                  <span className="col-span-2">Acciones</span>
                </div>
                {filtered.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="grid grid-cols-12 items-center px-6 py-4 border-b last:border-0 transition-colors"
                    style={{ borderColor: "var(--border-color)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--bg-primary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: "var(--color-primary-light)",
                        }}
                      >
                        <UserCircle
                          size={18}
                          style={{ color: "var(--color-icon)" }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {enrollment.student.full_name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {enrollment.student.document_type}{" "}
                          {enrollment.student.document_number}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap
                          size={14}
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <div>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {enrollment.program.name}
                          </p>
                          {enrollment.program.total_hours && (
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {enrollment.program.total_hours} horas
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {enrollment.enrollment_number || "—"}
                      </p>
                      {enrollment.folio && (
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Folio: {enrollment.folio}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {enrollment.year || "—"}
                      </p>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateLR002(enrollment)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: "var(--color-primary-light)",
                          color: "var(--color-primary)",
                        }}
                      >
                        <FileText size={13} /> LR002
                      </button>
                      <button
                        onClick={() => handleDelete(enrollment.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#dc2626";
                          e.currentTarget.style.backgroundColor = "#fee2e2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-secondary)";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal nueva matrícula */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl w-full max-w-lg"
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
                Nueva matrícula
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
                  Estudiante *
                </label>
                <select
                  value={form.student_id}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, student_id: e.target.value }));
                    setError("");
                  }}
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Selecciona un estudiante...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} — {s.document_type} {s.document_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Programa *
                </label>
                <select
                  value={form.program_id}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, program_id: e.target.value }));
                    setError("");
                  }}
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Selecciona un programa...</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
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
                    N° Matrícula
                  </label>
                  <input
                    type="text"
                    value={form.enrollment_number}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        enrollment_number: e.target.value,
                      }))
                    }
                    placeholder="Ej: 001"
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
                    Folio
                  </label>
                  <input
                    type="text"
                    value={form.folio}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, folio: e.target.value }))
                    }
                    placeholder="Ej: 01"
                    className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Año
                  </label>
                  <input
                    type="text"
                    value={form.year}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, year: e.target.value }))
                    }
                    placeholder={new Date().getFullYear().toString()}
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
                    Tipo certificado
                  </label>
                  <input
                    type="text"
                    value={form.certificate_type}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        certificate_type: e.target.value,
                      }))
                    }
                    placeholder="Ej: Técnico Laboral"
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
                  {saving ? "Guardando..." : "Registrar matrícula"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal LR002 */}
      {showLR002Modal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div
              className="flex items-center justify-between p-6 border-b sticky top-0"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Generar LR002
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Libro de Matrículas — datos autocompletados
                </p>
              </div>
              <button
                onClick={() => setShowLR002Modal(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={15} /> {error}
                </div>
              )}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "var(--color-primary-light)",
                  border: "1px solid var(--color-primary)",
                }}
              >
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: "var(--color-primary)" }}
                >
                  Datos autocompletados desde la matrícula
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Puedes editar cualquier campo antes de generar el PDF.
                </p>
              </div>
              {Object.entries(lr002Data).map(([key, value]) => (
                <div key={key}>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {key.replace(/_/g, " ")}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setLr002Data((p) => ({ ...p, [key]: e.target.value }))
                    }
                    className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowLR002Modal(false)}
                  className="flex-1 border font-medium py-3 rounded-lg transition-colors"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDownloadLR002}
                  disabled={downloading}
                  className="flex-1 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Download size={16} />
                  {downloading ? "Generando..." : "Descargar LR002"}
                </button>
              </div>
            </div>
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

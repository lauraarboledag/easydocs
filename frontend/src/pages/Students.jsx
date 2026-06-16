import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import {
  GraduationCap,
  Plus,
  Edit2,
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
  Upload,
} from "lucide-react";

const DOCUMENT_TYPES = ["CC", "TI", "CE", "PA", "RC"];

const EMPTY_FORM = {
  full_name: "",
  document_type: "CC",
  document_number: "",
  document_place: "",
  address: "",
  neighborhood: "",
  commune: "",
  phone: "",
  email: "",
  is_minor: false,
  guardian_name: "",
  guardian_document: "",
  guardian_address: "",
  guardian_phone: "",
};

export default function Students() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programIdFilter = searchParams.get("program_id");

  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(programIdFilter || "");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
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

  useEffect(() => {
    fetchStudents();
  }, [selectedProgram]);

  const fetchPrograms = async () => {
    try {
      const res = await api.get("/programs/");
      setPrograms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const url = selectedProgram
        ? `/students/?program_id=${selectedProgram}`
        : "/students/";
      const res = await api.get(url);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (student = null) => {
    setEditing(student);
    setForm(
      student
        ? {
            full_name: student.full_name,
            document_type: student.document_type,
            document_number: student.document_number,
            document_place: student.document_place || "",
            address: student.address || "",
            neighborhood: student.neighborhood || "",
            commune: student.commune || "",
            phone: student.phone || "",
            email: student.email || "",
            is_minor: student.is_minor,
            guardian_name: student.guardian_name || "",
            guardian_document: student.guardian_document || "",
            guardian_address: student.guardian_address || "",
            guardian_phone: student.guardian_phone || "",
            program_id: "",
            custom_program: "",
            custom_certificate_type: "",
            custom_total_hours: "",
            custom_resolution: "",
          }
        : EMPTY_FORM,
    );
    setError("");
    setShowModal(true);
  };

  const CERTIFICATE_TYPES = [
    "Técnico Laboral por Competencias",
    "Técnico Laboral en Salud",
    "Conocimientos Académicos",
    "Educación Informal",
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.document_number) {
      setError("Nombre y documento son obligatorios.");
      return;
    }
    if (form.program_id === "otro" && !form.custom_program?.trim()) {
      setError("Escribe el nombre del programa.");
      return;
    }
    setSaving(true);
    try {
      const {
        program_id,
        custom_program,
        custom_certificate_type,
        custom_total_hours,
        custom_resolution,
        ...studentData
      } = form;
      let finalProgramId = program_id;

      if (editing) {
        await api.put(`/students/${editing.id}`, studentData);
        setSuccess("Estudiante actualizado.");
      } else {
        // Si es "Otro", crear el programa con todos sus datos
        if (program_id === "otro" && custom_program) {
          const progRes = await api.post("/programs/", {
            name: custom_program,
            certificate_type: custom_certificate_type || null,
            total_hours: custom_total_hours || null,
            resolution: custom_resolution || null,
          });
          finalProgramId = progRes.data.id;
          const programsRes = await api.get("/programs/");
          setPrograms(programsRes.data);
        }

        const res = await api.post("/students/", studentData);

        if (finalProgramId && finalProgramId !== "otro") {
          await api.post("/enrollments/", {
            student_id: res.data.id,
            program_id: finalProgramId,
          });
        }
        setSuccess(
          "Estudiante creado" + (finalProgramId ? " y matriculado." : "."),
        );
      }
      setShowModal(false);
      fetchStudents();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Deseas desactivar este estudiante?")) return;
    try {
      await api.delete(`/students/${id}`);
      setSuccess("Estudiante desactivado.");
      fetchStudents();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get("/students/template/xlsx", {
        responseType: "blob",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.setAttribute("download", "plantilla_estudiantes.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/students/export/xlsx", {
        responseType: "blob",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.setAttribute("download", "estudiantes.xlsx");
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
      const res = await api.post("/students/import/xlsx", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(
        `${res.data.message}${res.data.errors.length > 0 ? ` (${res.data.errors.length} errores)` : ""}`,
      );
      fetchStudents();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError("Error al importar el archivo.");
    }
    e.target.value = "";
  };

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.document_number.includes(search),
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="ml-56 flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/programas")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Estudiantes
              </h1>
              <p className="text-xs text-gray-400">
                Gestión de estudiantes por programa
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-1">
              ¿Primera vez registrando estudiantes?
            </p>
            <p className="text-xs text-amber-600">
              Antes de importar estudiantes, asegúrate de haber registrado los{" "}
              <strong>programas</strong> en la sección correspondiente. Al
              importar, cada estudiante debe tener un programa que ya exista en
              el sistema — de lo contrario esa fila será omitida. Descarga la{" "}
              <strong>Plantilla xlsx</strong> para ver el formato correcto.
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
                Estudiantes registrados
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {filtered.length} estudiante{filtered.length !== 1 ? "s" : ""}
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
                <Plus size={18} /> Nuevo estudiante
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
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
          <div className="bg-white rounded-xl border border-gray-100">
            {loading ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                Cargando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GraduationCap size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Sin estudiantes aún</p>
                <p className="text-gray-400 text-sm mt-1">
                  Registra el primer estudiante de tu institución
                </p>
                <button
                  onClick={() => handleOpen()}
                  className="mt-4 text-sm text-[#2952cc] font-medium hover:underline"
                >
                  Agregar estudiante →
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-12 text-xs text-gray-400 uppercase tracking-wide px-6 py-3 border-b border-gray-50">
                  <span className="col-span-4">Nombre</span>
                  <span className="col-span-3">Documento</span>
                  <span className="col-span-2">Teléfono</span>
                  <span className="col-span-2">Estado</span>
                  <span className="col-span-1">Acciones</span>
                </div>
                {filtered.map((student) => (
                  <div
                    key={student.id}
                    className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#2952cc] text-xs font-bold">
                          {student.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {student.full_name}
                        </p>
                        {student.email && (
                          <p className="text-xs text-gray-400">
                            {student.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm text-gray-600">
                        {student.document_type} {student.document_number}
                      </p>
                      {student.document_place && (
                        <p className="text-xs text-gray-400">
                          {student.document_place}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">
                        {student.phone || "—"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${student.is_minor ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                      >
                        {student.is_minor ? "Menor de edad" : "Mayor de edad"}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center gap-1">
                      <button
                        onClick={() => handleOpen(student)}
                        className="p-1.5 text-gray-400 hover:text-[#2952cc] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Modal crear/editar estudiante */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">
                {editing ? "Editar estudiante" : "Nuevo estudiante"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, full_name: e.target.value }));
                    setError("");
                  }}
                  placeholder="Ej: María García López"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Tipo doc *
                  </label>
                  <select
                    value={form.document_type}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, document_type: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    N° Documento *
                  </label>
                  <input
                    type="text"
                    value={form.document_number}
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        document_number: e.target.value,
                      }));
                      setError("");
                    }}
                    placeholder="Número"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Lugar expedición
                  </label>
                  <input
                    type="text"
                    value={form.document_place}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, document_place: e.target.value }))
                    }
                    placeholder="Ciudad"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+57 300 000 0000"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Correo
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="correo@ejemplo.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="Calle 45 # 12-34"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Barrio
                  </label>
                  <input
                    type="text"
                    value={form.neighborhood}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, neighborhood: e.target.value }))
                    }
                    placeholder="Barrio"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Comuna
                  </label>
                  <input
                    type="text"
                    value={form.commune}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, commune: e.target.value }))
                    }
                    placeholder="Comuna"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Programa
                  </label>
                  <select
                    value={
                      form.program_id === "otro"
                        ? "otro"
                        : form.program_id || ""
                    }
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        program_id: e.target.value,
                        custom_program: "",
                      }));
                    }}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
                  >
                    <option value="">Sin programa asignado</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <option value="otro">Otro (especificar)</option>
                  </select>

                  {form.program_id === "otro" && (
                    <div className="mt-2 space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Datos del nuevo programa
                      </p>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Nombre del programa *
                        </label>
                        <input
                          type="text"
                          value={form.custom_program || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              .toLowerCase()
                              .replace(/(^\w|\s\w)/g, (c) => c.toUpperCase());
                            setForm((p) => ({ ...p, custom_program: value }));
                          }}
                          placeholder="Ej: Auxiliar de Enfermería"
                          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Tipo de certificado
                        </label>
                        <select
                          value={form.custom_certificate_type || ""}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              custom_certificate_type: e.target.value,
                            }))
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

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Total horas
                          </label>
                          <input
                            type="text"
                            value={form.custom_total_hours || ""}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                custom_total_hours: e.target.value,
                              }))
                            }
                            placeholder="Ej: 1440"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            N° Resolución
                          </label>
                          <input
                            type="text"
                            value={form.custom_resolution || ""}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                custom_resolution: e.target.value,
                              }))
                            }
                            placeholder="Ej: 001 de 2024"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
                          />
                        </div>
                      </div>

                      <p className="text-xs text-gray-400">
                        El programa se creará automáticamente. Podrás editarlo
                        después en <strong>Programas</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                <input
                  type="checkbox"
                  id="is_minor"
                  checked={form.is_minor}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, is_minor: e.target.checked }))
                  }
                  className="accent-[#2952cc]"
                />
                <label
                  htmlFor="is_minor"
                  className="text-sm text-gray-700 font-medium"
                >
                  El estudiante es menor de edad
                </label>
              </div>

              {form.is_minor && (
                <div className="space-y-4 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                    Datos del representante legal
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Nombre representante
                      </label>
                      <input
                        type="text"
                        value={form.guardian_name}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            guardian_name: e.target.value,
                          }))
                        }
                        placeholder="Nombre completo"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Documento representante
                      </label>
                      <input
                        type="text"
                        value={form.guardian_document}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            guardian_document: e.target.value,
                          }))
                        }
                        placeholder="N° Documento"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Dirección representante
                      </label>
                      <input
                        type="text"
                        value={form.guardian_address}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            guardian_address: e.target.value,
                          }))
                        }
                        placeholder="Dirección"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Teléfono representante
                      </label>
                      <input
                        type="text"
                        value={form.guardian_phone}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            guardian_phone: e.target.value,
                          }))
                        }
                        placeholder="Teléfono"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                      : "Crear estudiante"}
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

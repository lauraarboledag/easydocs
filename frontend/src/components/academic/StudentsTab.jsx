import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import {
    GraduationCap,
    Plus,
    Edit2,
    Trash2,
    X,
    Save,
    AlertCircle,
    CheckCircle,
    Search,
    Filter,
    Download,
    Upload,
    UserCircle,
    Phone,
    Mail,
    MapPin,
} from "lucide-react";

const DOCUMENT_TYPES = ["CC", "TI", "CE", "PA", "RC"];

// Teléfono: opcional; si se escribe, solo dígitos, espacios, guiones y "+" al inicio,
// con entre 7 y 15 dígitos (los espacios y guiones no cuentan).
const PHONE_RE = /^\+?[\d\s-]+$/;
const isValidPhone = (value) => {
    const v = (value || "").trim();
    if (!v) return true;
    const digits = v.replace(/\D/g, "").length;
    return PHONE_RE.test(v) && digits >= 7 && digits <= 15;
};
// FastAPI devuelve "detail" como texto (HTTPException) o como arreglo (errores 422 de Pydantic)
const formatApiError = (err, fallback) => {
    const detail = err.response?.data?.detail;
    if (Array.isArray(detail)) {
        return detail
            .map((e) => (e.msg || "").replace(/^Value error, /, ""))
            .join(" ");
    }
    if (typeof detail === "string") return detail;
    return fallback;
};

const PHONE_ERROR =
    "solo puede tener números, espacios, guiones y + al inicio (entre 7 y 15 dígitos).";

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
    program_id: "",
    custom_program: "",
    custom_certificate_type: "",
    custom_total_hours: "",
    custom_resolution: "",
};

export default function StudentsTab({ onChange }) {
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
    const [ageFilter, setAgeFilter] = useState(""); // "" | "minor" | "adult"

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
            setError("Error al cargar los programas. Intenta de nuevo más tarde");
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const url = selectedProgram
                ? `/students/?program_id=${selectedProgram}`
                : "/students/";
            const res = await api.get(url);
            const sorted = [...res.data].sort((a, b) =>
                a.full_name.localeCompare(b.full_name, "es"),
            );
            setStudents(sorted);
        } catch (err) {
            setError("Error al cargar los estudiantes. Intenta de nuevo más tarde");
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

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.full_name || !form.document_number) {
            setError("Nombre y documento son obligatorios.");
            return;
        }
        if (!isValidPhone(form.phone)) {
            setError(`El teléfono ${PHONE_ERROR}`);
            return;
        }
        if (form.is_minor && !isValidPhone(form.guardian_phone)) {
            setError(`El teléfono del representante ${PHONE_ERROR}`);
            return;
        }
        if (!editing && !form.program_id) {
            setError("Selecciona el programa o nivel del estudiante.");
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
            onChange?.();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(formatApiError(err, "Error al guardar."));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (
            !confirm(
                "¿Deseas desactivar este estudiante? También se cancelarán sus matrículas.",
            )
        )
            return;
        try {
            await api.delete(`/students/${id}`);
            setSuccess("Estudiante desactivado y sus matrículas canceladas.");
            fetchStudents();
            onChange?.();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError("Error al desactivar estudiante. Intenta de nuevo más tarde");
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
            setError("Error al descargar plantilla. Intenta de nuevo más tarde");
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
            setError("Error al exportar documento. Intenta de nuevo más tarde");
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
            onChange?.();
            setTimeout(() => setSuccess(""), 5000);
        } catch (err) {
            setError("Error al importar el archivo.");
        }
        e.target.value = "";
    };

    const filtered = students.filter((s) => {
        const matchesSearch =
            s.full_name.toLowerCase().includes(search.toLowerCase()) ||
            s.document_number.includes(search);
        const matchesAge =
            ageFilter === "" ||
            (ageFilter === "minor" && s.is_minor) ||
            (ageFilter === "adult" && !s.is_minor);
        return matchesSearch && matchesAge;
    });

    const inputStyle = {
        borderColor: "var(--border-color)",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
    };
    const selectStyle = {
        borderColor: "var(--border-color)",
        backgroundColor: "var(--bg-secondary)",
        color: "var(--text-primary)",
    };

    return (
        <div>

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
                    <CheckCircle size={16} /> {success}
                </div>
            )}

            {/* Métricas rápidas */}
            {students.length > 0 && (
                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                    {[
                        {
                            label: "Total estudiantes",
                            value: students.length,
                            icon: UserCircle,
                            filter: "",
                        },
                        {
                            label: "Mayores de edad",
                            value: students.filter((s) => !s.is_minor).length,
                            icon: GraduationCap,
                            filter: "adult",
                        },
                        {
                            label: "Menores de edad",
                            value: students.filter((s) => s.is_minor).length,
                            icon: GraduationCap,
                            filter: "minor",
                        },
                    ].map(({ label, value, icon: Icon, filter }) => (
                        <button
                            type="button"
                            key={label}
                            onClick={() => setAgeFilter(filter)}
                            className="text-left rounded-xl border p-3 md:p-4 flex items-center gap-3 md:gap-4 min-w-0 transition-colors"
                            style={{
                                backgroundColor:
                                    ageFilter === filter
                                        ? "var(--color-primary-light)"
                                        : "var(--bg-secondary)",
                                borderColor:
                                    ageFilter === filter
                                        ? "var(--color-primary)"
                                        : "var(--border-color)",
                            }}
                        >
                            <div
                                className="hidden sm:flex w-10 h-10 rounded-lg items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: "var(--color-primary-light)" }}
                            >
                                <Icon size={18} style={{ color: "var(--color-icon)" }} />
                            </div>
                            <div className="min-w-0">
                                <p
                                    className="text-xl md:text-2xl font-bold"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {value}
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    {label}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Header acciones */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h2
                        className="text-xl font-bold"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Estudiantes registrados
                    </h2>
                    <p
                        className="text-sm mt-1"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        {filtered.length} estudiante{filtered.length !== 1 ? "s" : ""} —
                        orden alfabético
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <button
                        onClick={handleDownloadTemplate}
                        className="border font-medium px-3 md:px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
                        style={{
                            borderColor: "var(--border-color)",
                            color: "var(--text-secondary)",
                            backgroundColor: "var(--bg-secondary)",
                        }}
                    >
                        <Download size={16} /> Plantilla xlsx
                    </button>
                    <label
                        className="border font-medium px-3 md:px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm cursor-pointer"
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
                        className="border font-medium px-3 md:px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
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
                        className="order-first sm:order-none w-full sm:w-auto justify-center text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        <Plus size={18} /> Nuevo estudiante
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div
                className="rounded-xl border p-4 mb-6 flex flex-col sm:flex-row gap-3"
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
                        style={inputStyle}
                    />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                    <Filter
                        size={16}
                        className="flex-shrink-0"
                        style={{ color: "var(--text-secondary)" }}
                    />
                    <select
                        value={selectedProgram}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                        className="flex-1 min-w-0 sm:flex-none sm:max-w-[240px] text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2"
                        style={selectStyle}
                    >
                        <option value="">Todos los programas</option>
                        {programs.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={ageFilter}
                        onChange={(e) => setAgeFilter(e.target.value)}
                        className="flex-1 min-w-0 sm:flex-none sm:max-w-[180px] text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2"
                        style={selectStyle}
                    >
                        <option value="">Todas las edades</option>
                        <option value="adult">Mayores de edad</option>
                        <option value="minor">Menores de edad</option>
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
                            <GraduationCap
                                size={32}
                                style={{ color: "var(--text-secondary)", opacity: 0.4 }}
                            />
                        </div>
                        <p
                            className="font-medium"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {students.length > 0
                                ? "Ningún estudiante coincide con los filtros"
                                : "Sin estudiantes aún"}
                        </p>
                        <p
                            className="text-sm mt-1"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            Registra el primer estudiante de tu institución
                        </p>
                        <button
                            onClick={() => handleOpen()}
                            className="mt-4 text-sm font-medium hover:underline"
                            style={{ color: "var(--color-primary)" }}
                        >
                            Agregar estudiante →
                        </button>
                    </div>
                ) : (
                    <>
                        <div
                            className="hidden md:grid grid-cols-12 text-xs uppercase tracking-wide px-6 py-3 border-b"
                            style={{
                                color: "var(--text-secondary)",
                                borderColor: "var(--border-color)",
                            }}
                        >
                            <span className="col-span-4">Estudiante</span>
                            <span className="col-span-3">Documento</span>
                            <span className="col-span-2">Contacto</span>
                            <span className="col-span-2">Estado</span>
                            <span className="col-span-1">Acciones</span>
                        </div>
                        {filtered.map((student) => (
                            <div
                                key={student.id}
                                className="flex flex-col gap-3 md:grid md:grid-cols-12 md:items-center px-4 md:px-6 py-4 border-b last:border-0 transition-colors"
                                style={{ borderColor: "var(--border-color)" }}
                                onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                    "var(--bg-primary)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = "transparent")
                                }
                            >
                                <div className="col-span-4 flex items-center gap-3 min-w-0">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{
                                            backgroundColor: "var(--color-primary-light)",
                                        }}
                                    >
                                        <UserCircle
                                            size={20}
                                            style={{ color: "var(--color-icon)" }}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p
                                            className="text-sm font-medium break-words"
                                            style={{ color: "var(--text-primary)" }}
                                        >
                                            {student.full_name}
                                        </p>
                                        {student.email && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Mail
                                                    size={10}
                                                    style={{ color: "var(--text-secondary)" }}
                                                />
                                                <p
                                                    className="text-xs truncate"
                                                    style={{ color: "var(--text-secondary)" }}
                                                >
                                                    {student.email}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        {student.document_type} {student.document_number}
                                    </p>
                                    {student.document_place && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <MapPin
                                                size={10}
                                                style={{ color: "var(--text-secondary)" }}
                                            />
                                            <p
                                                className="text-xs"
                                                style={{ color: "var(--text-secondary)" }}
                                            >
                                                {student.document_place}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    {student.phone ? (
                                        <div className="flex items-center gap-1.5">
                                            <Phone
                                                size={12}
                                                style={{ color: "var(--text-secondary)" }}
                                            />
                                            <p
                                                className="text-sm"
                                                style={{ color: "var(--text-primary)" }}
                                            >
                                                {student.phone}
                                            </p>
                                        </div>
                                    ) : (
                                        <p
                                            className="text-sm"
                                            style={{ color: "var(--text-secondary)" }}
                                        >
                                            —
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <span
                                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                                        style={{
                                            backgroundColor: student.is_minor
                                                ? "#fef3c7"
                                                : "#f0fdf4",
                                            color: student.is_minor ? "#b45309" : "#16a34a",
                                        }}
                                    >
                                        {student.is_minor ? "Menor de edad" : "Mayor de edad"}
                                    </span>
                                </div>
                                <div className="col-span-1 flex items-center gap-1 justify-end md:justify-start">
                                    <button
                                        onClick={() => handleOpen(student)}
                                        className="p-2.5 md:p-1.5 rounded-lg transition-colors"
                                        style={{ color: "var(--text-secondary)" }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = "var(--color-primary)";
                                            e.currentTarget.style.backgroundColor =
                                                "var(--color-primary-light)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = "var(--text-secondary)";
                                            e.currentTarget.style.backgroundColor = "transparent";
                                        }}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(student.id)}
                                        className="p-2.5 md:p-1.5 rounded-lg transition-colors"
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div
                        className="rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                        <div
                            className="flex items-center justify-between p-4 md:p-6 border-b sticky top-0"
                            style={{
                                borderColor: "var(--border-color)",
                                backgroundColor: "var(--bg-secondary)",
                            }}
                        >
                            <h3
                                className="text-lg font-bold"
                                style={{ color: "var(--text-primary)" }}
                            >
                                {editing ? "Editar estudiante" : "Nuevo estudiante"}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-4 md:p-6 space-y-5">
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
                                    className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                    style={inputStyle}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Tipo doc *
                                    </label>
                                    <select
                                        value={form.document_type}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, document_type: e.target.value }))
                                        }
                                        className="w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2"
                                        style={selectStyle}
                                    >
                                        {DOCUMENT_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
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
                                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Lugar expedición
                                    </label>
                                    <input
                                        type="text"
                                        value={form.document_place}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, document_place: e.target.value }))
                                        }
                                        placeholder="Ciudad"
                                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        inputMode="tel"
                                        maxLength={20}
                                        value={form.phone}
                                        onChange={(e) => {
                                            setForm((p) => ({ ...p, phone: e.target.value }));
                                            setError("");
                                        }}
                                        placeholder="+57 300 000 0000"
                                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                        style={{
                                            ...inputStyle,
                                            ...(isValidPhone(form.phone) ? {} : { borderColor: "#dc2626" }),
                                        }}
                                    />
                                    {!isValidPhone(form.phone) && (
                                        <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                                            Solo números, espacios, guiones y + (7 a 15 dígitos).
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Correo
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, email: e.target.value }))
                                        }
                                        placeholder="correo@ejemplo.com"
                                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, address: e.target.value }))
                                        }
                                        placeholder="Calle 45 # 12-34"
                                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Barrio
                                    </label>
                                    <input
                                        type="text"
                                        value={form.neighborhood}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, neighborhood: e.target.value }))
                                        }
                                        placeholder="Barrio"
                                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Comuna
                                    </label>
                                    <input
                                        type="text"
                                        value={form.commune}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, commune: e.target.value }))
                                        }
                                        placeholder="Comuna"
                                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {!editing && (
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Programa o nivel *
                                    </label>
                                    <select
                                        value={
                                            form.program_id === "otro" ? "otro" : form.program_id || ""
                                        }
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                program_id: e.target.value,
                                                custom_program: "",
                                            }))
                                        }
                                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                        style={selectStyle}
                                    >
                                        <option value="">Selecciona un programa...</option>
                                        {programs.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                        <option value="otro">Otro (especificar)</option>
                                    </select>
                                    <p
                                        className="text-xs mt-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Al crear el estudiante se genera su matrícula en este
                                        programa. El folio y el número se completan en el paso 3.
                                    </p>

                                    {form.program_id === "otro" && (
                                        <div
                                            className="mt-3 space-y-3 rounded-xl p-4 border"
                                            style={{
                                                backgroundColor: "var(--bg-primary)",
                                                borderColor: "var(--border-color)",
                                            }}
                                        >
                                            <p
                                                className="text-xs font-semibold uppercase tracking-wide"
                                                style={{ color: "var(--text-secondary)" }}
                                            >
                                                Datos del nuevo programa
                                            </p>
                                            <div>
                                                <label
                                                    className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                                    style={{ color: "var(--text-secondary)" }}
                                                >
                                                    Nombre *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.custom_program || ""}
                                                    onChange={(e) => {
                                                        const v = e.target.value
                                                            .toLowerCase()
                                                            .replace(/(^\w|\s\w)/g, (c) => c.toUpperCase());
                                                        setForm((p) => ({ ...p, custom_program: v }));
                                                    }}
                                                    placeholder="Ej: Auxiliar de Enfermería"
                                                    className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                                    style={inputStyle}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label
                                                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                                        style={{ color: "var(--text-secondary)" }}
                                                    >
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
                                                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                                        style={inputStyle}
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
                                                        value={form.custom_resolution || ""}
                                                        onChange={(e) =>
                                                            setForm((p) => ({
                                                                ...p,
                                                                custom_resolution: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Ej: 001 de 2024"
                                                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                                        style={inputStyle}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div
                                className="flex items-center gap-3 rounded-xl p-4 border"
                                style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
                            >
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
                                    className="text-sm font-medium"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    El estudiante es menor de edad
                                </label>
                            </div>

                            {form.is_minor && (
                                <div
                                    className="space-y-4 rounded-xl p-4 border"
                                    style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
                                >
                                    <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">
                                        Datos del representante legal
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            {
                                                key: "guardian_name",
                                                label: "Nombre representante",
                                                placeholder: "Nombre completo",
                                            },
                                            {
                                                key: "guardian_document",
                                                label: "Documento representante",
                                                placeholder: "N° Documento",
                                            },
                                            {
                                                key: "guardian_address",
                                                label: "Dirección representante",
                                                placeholder: "Dirección",
                                            },
                                            {
                                                key: "guardian_phone",
                                                label: "Teléfono representante",
                                                placeholder: "Teléfono",
                                            },
                                        ].map(({ key, label, placeholder }) => (
                                            <div key={key}>
                                                <label
                                                    className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                                    style={{ color: "var(--text-secondary)" }}
                                                >
                                                    {label}
                                                </label>
                                                <input
                                                    type={key === "guardian_phone" ? "tel" : "text"}
                                                    inputMode={key === "guardian_phone" ? "tel" : undefined}
                                                    maxLength={key === "guardian_phone" ? 20 : undefined}
                                                    value={form[key]}
                                                    onChange={(e) => {
                                                        setForm((p) => ({ ...p, [key]: e.target.value }));
                                                        setError("");
                                                    }}
                                                    placeholder={placeholder}
                                                    className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                                    style={{
                                                        ...inputStyle,
                                                        ...(key === "guardian_phone" &&
                                                            !isValidPhone(form.guardian_phone)
                                                            ? { borderColor: "#dc2626" }
                                                            : {}),
                                                    }}
                                                />
                                                {key === "guardian_phone" &&
                                                    !isValidPhone(form.guardian_phone) && (
                                                        <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                                                            Solo números, espacios, guiones y + (7 a 15 dígitos).
                                                        </p>
                                                    )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                            : "Crear estudiante"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
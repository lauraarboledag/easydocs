import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import {
    analyzeConditionals,
    getMinorConditions,
    GUARDIAN_AUTOFILL,
} from "../../utils/templateConditionals";
import {
    ClipboardList,
    Plus,
    Trash2,
    Edit2,
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

const CERTIFICATE_TYPES = [
    "Técnico Laboral por Competencias",
    "Técnico Laboral en Salud",
    "Conocimientos Académicos",
    "Educación Informal",
];

export default function EnrollmentsTab({ onChange }) {
    const [searchParams] = useSearchParams();
    const programIdFilter = searchParams.get("program_id");
    const folioParam = searchParams.get("folio"); // "con" | "sin" (opcional, desde la URL)

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
    const [folioFilter, setFolioFilter] = useState(
        folioParam === "con" || folioParam === "sin" ? folioParam : "",
    ); // "" | "con" | "sin"
    const [lr002Data, setLr002Data] = useState({});
    const [allEnrollments, setAllEnrollments] = useState([]);
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm] = useState({
        enrollment_number: "",
        folio: "",
        certificate_type: "",
        year: "",
    });

    useEffect(() => {
        fetchData();
    }, []);
    useEffect(() => {
        fetchEnrollments();
    }, [selectedProgram]);

    const fetchData = async () => {
        try {
            const [studentsRes, programsRes, templatesRes, allEnrRes] = await Promise.all([
                api.get("/students/"),
                api.get("/programs/"),
                api.get("/templates/"),
                api.get("/enrollments/"),
            ]);
            // Ordenar estudiantes alfabéticamente
            const sortedStudents = [...studentsRes.data].sort((a, b) =>
                a.full_name.localeCompare(b.full_name, "es"),
            );
            setStudents(sortedStudents);
            setPrograms(programsRes.data);
            setTemplates(templatesRes.data);
            setAllEnrollments(allEnrRes.data);
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
            if (existingEnrollment) {
                // Ya existe (se creó en el paso 1): solo se completan sus datos
                const { enrollment_number, folio, certificate_type, year } = form;
                await api.put(`/enrollments/${existingEnrollment.id}`, {
                    enrollment_number,
                    folio,
                    certificate_type,
                    year,
                });
                setSuccess("Datos de la matrícula actualizados.");
            } else {
                await api.post("/enrollments/", form);
                setSuccess("Matrícula registrada exitosamente.");
            }
            setShowModal(false);
            fetchEnrollments();
            fetchData();
            onChange?.();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || "Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    const handleEditOpen = (enrollment) => {
        setEditing(enrollment);
        setEditForm({
            enrollment_number: enrollment.enrollment_number || "",
            folio: enrollment.folio || "",
            certificate_type: enrollment.certificate_type || "",
            year: enrollment.year || "",
        });
        setError("");
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/enrollments/${editing.id}`, editForm);
            setSuccess("Matrícula actualizada.");
            setEditing(null);
            fetchEnrollments();
            fetchData();
            onChange?.();
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
            fetchData();
            onChange?.();
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
        const s = enrollment.student;
        const lr002Template = templates.find((t) => t.document_type === "LR002");
        const conditionals = analyzeConditionals(lr002Template?.template_html || "");

        const data = {
            nombre_estudiante: s.full_name,
            tipo_documento: s.document_type,
            documento_estudiante: s.document_number,
            lugar_expedicion: s.document_place || "",
            direccion: s.address || "",
            barrio: s.neighborhood || "",
            comuna: s.commune || "",
            telefono_estudiante: s.phone || "",
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
        };

        // Condición de menor de edad como booleano real + datos del representante
        getMinorConditions(conditionals).forEach((c) => {
            data[c] = !!s.is_minor;
        });
        if (s.is_minor) {
            Object.entries(GUARDIAN_AUTOFILL).forEach(([key, studentKey]) => {
                data[key] = s[studentKey] || "";
            });
        }

        setSelectedEnrollment(enrollment);
        setLr002Data(data);
        setError("");
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
            const detail = err.response?.data?.detail;
            setError(
                typeof detail === "string"
                    ? detail
                    : detail?.message || "Error al generar el LR002.",
            );
        } finally {
            setDownloading(false);
        }
    };

    // Matrículas activas de un estudiante (todas, sin filtro de programa)
    const enrollmentsOfStudent = (studentId) =>
        allEnrollments.filter((e) => String(e.student.id) === String(studentId));

    // Programas en los que ya está matriculado un estudiante
    const programsOfStudent = (studentId) =>
        enrollmentsOfStudent(studentId).map((e) => e.program.name);

    const programIdOf = (enrollment) =>
        String(enrollment.program_id ?? enrollment.program?.id ?? "");

    // Matrícula que ya existe para el estudiante + programa elegidos en el modal
    const existingEnrollment = form.student_id && form.program_id
        ? enrollmentsOfStudent(form.student_id).find(
            (e) => programIdOf(e) === String(form.program_id),
        )
        : null;

    // Copia al formulario los datos de una matrícula existente
    const formFromEnrollment = (enrollment, base) => ({
        ...base,
        program_id: programIdOf(enrollment),
        enrollment_number: enrollment.enrollment_number || "",
        folio: enrollment.folio || "",
        certificate_type: enrollment.certificate_type || "",
        year: enrollment.year || base.year,
    });

    const handleSelectStudent = (studentId) => {
        setError("");
        const existing = enrollmentsOfStudent(studentId);
        if (existing.length === 0) {
            setForm((p) => ({ ...p, student_id: studentId }));
            return;
        }
        // Prioriza el programa del filtro activo; si no, el primero del estudiante
        const match =
            existing.find((e) => programIdOf(e) === String(selectedProgram)) || existing[0];
        setForm((p) => formFromEnrollment(match, { ...p, student_id: studentId }));
    };

    const handleSelectProgram = (programId) => {
        setError("");
        const match = enrollmentsOfStudent(form.student_id).find(
            (e) => programIdOf(e) === String(programId),
        );
        setForm((p) =>
            match
                ? formFromEnrollment(match, p)
                : {
                    ...p,
                    program_id: programId,
                    enrollment_number: "",
                    folio: "",
                    certificate_type: "",
                    year: EMPTY_FORM.year,
                },
        );
    };

    const hasFolio = (e) => !!e.folio?.toString().trim();

    const filtered = enrollments.filter((e) => {
        const matchesSearch =
            e.student.full_name.toLowerCase().includes(search.toLowerCase()) ||
            e.student.document_number.includes(search);
        const matchesFolio =
            folioFilter === "" ||
            (folioFilter === "con" && hasFolio(e)) ||
            (folioFilter === "sin" && !hasFolio(e));
        return matchesSearch && matchesFolio;
    });

    const withoutFolioCount = enrollments.filter((e) => !hasFolio(e)).length;

    return (
        <div>
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
                    <CheckCircle size={16} /> {success}
                </div>
            )}

            {/* Header acciones */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
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
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <button
                        onClick={handleExportXlsx}
                        className="border font-medium px-3 md:px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
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
                        className="order-first sm:order-none w-full sm:w-auto justify-center text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        <Plus size={18} /> Nueva matrícula
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
                        style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-primary)",
                        }}
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
                    <select
                        value={folioFilter}
                        onChange={(e) => setFolioFilter(e.target.value)}
                        className="flex-1 min-w-0 sm:flex-none sm:max-w-[180px] text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2"
                        style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                        }}
                    >
                        <option value="">Todos los folios</option>
                        <option value="con">Con folio</option>
                        <option value="sin">
                            Sin folio{withoutFolioCount ? ` (${withoutFolioCount})` : ""}
                        </option>
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
                            {enrollments.length > 0
                                ? "Ninguna matrícula coincide con los filtros"
                                : "Sin matrículas aún"}
                        </p>
                        <p
                            className="text-sm mt-1"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            {enrollments.length > 0
                                ? folioFilter === "sin"
                                    ? "¡Todas las matrículas tienen folio!"
                                    : "Prueba cambiando la búsqueda o los filtros"
                                : "Registra la primera matrícula"}
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
                            className="hidden md:grid grid-cols-12 text-xs uppercase tracking-wide px-6 py-3 border-b"
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
                                <div className="col-span-3 flex items-center gap-3 min-w-0">
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
                                    <div className="min-w-0">
                                        <p
                                            className="text-sm font-medium break-words"
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
                                    <div className="flex items-center gap-2 min-w-0">
                                        <GraduationCap
                                            size={14}
                                            className="flex-shrink-0"
                                            style={{ color: "var(--text-secondary)" }}
                                        />
                                        <div className="min-w-0">
                                            <p
                                                className="text-sm break-words"
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
                                        className="md:hidden text-xs uppercase tracking-wide mb-0.5"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        N° Matrícula
                                    </p>
                                    <p
                                        className="text-sm"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        {enrollment.enrollment_number || "—"}
                                    </p>
                                    {enrollment.folio ? (
                                        <p
                                            className="text-xs"
                                            style={{ color: "var(--text-secondary)" }}
                                        >
                                            Folio: {enrollment.folio}
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleEditOpen(enrollment)}
                                            title="Completar folio"
                                            className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 hover:underline"
                                            style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
                                        >
                                            Sin folio
                                        </button>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <p
                                        className="md:hidden text-xs uppercase tracking-wide mb-0.5"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Año
                                    </p>
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
                                        className="flex items-center gap-1 text-xs px-2.5 py-2 md:py-1.5 rounded-lg font-medium transition-colors"
                                        style={{
                                            backgroundColor: "var(--color-primary-light)",
                                            color: "var(--color-primary)",
                                        }}
                                    >
                                        <FileText size={13} /> LR002
                                    </button>
                                    <button
                                        onClick={() => handleEditOpen(enrollment)}
                                        title="Editar matrícula"
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
                                        onClick={() => handleDelete(enrollment.id)}
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

            {/* Modal nueva matrícula */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div
                        className="rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                        <div
                            className="flex items-center justify-between p-4 md:p-6 border-b"
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
                        <form onSubmit={handleSave} className="p-4 md:p-6 space-y-4">
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
                                    onChange={(e) => handleSelectStudent(e.target.value)}
                                    className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                    style={{
                                        borderColor: "var(--border-color)",
                                        backgroundColor: "var(--bg-secondary)",
                                        color: "var(--text-primary)",
                                    }}
                                >
                                    <option value="">Selecciona un estudiante...</option>
                                    {students.map((s) => {
                                        const progs = programsOfStudent(s.id);
                                        return (
                                            <option key={s.id} value={s.id}>
                                                {s.full_name} — {s.document_type} {s.document_number}
                                                {progs.length ? ` · ${progs.join(", ")}` : " · sin matrícula"}
                                            </option>
                                        );
                                    })}
                                </select>
                                {form.student_id && programsOfStudent(form.student_id).length > 1 && (
                                    <p
                                        className="text-xs mt-2"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Matriculado en: {programsOfStudent(form.student_id).join(", ")}.
                                    </p>
                                )}
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
                                    onChange={(e) => handleSelectProgram(e.target.value)}
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
                                {existingEnrollment && (
                                    <p
                                        className="text-xs mt-2 rounded-lg px-3 py-2 border"
                                        style={{
                                            backgroundColor: "#eff6ff",
                                            borderColor: "#bfdbfe",
                                            color: "#1d4ed8",
                                        }}
                                    >
                                        Este estudiante ya está matriculado en este programa. Completa o corrige el número, folio, año y tipo de
                                        certificado; al guardar se actualiza su matrícula.
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                            backgroundColor: "var(--bg-primary)",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        <option value="">Igual al del programa</option>
                                        {CERTIFICATE_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
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
                                        : existingEnrollment
                                            ? "Guardar datos"
                                            : "Registrar matrícula"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal editar matrícula */}
            {editing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div
                        className="rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                        <div
                            className="flex items-center justify-between p-4 md:p-6 border-b"
                            style={{ borderColor: "var(--border-color)" }}
                        >
                            <h3
                                className="text-lg font-bold"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Editar matrícula
                            </h3>
                            <button
                                onClick={() => setEditing(null)}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSave} className="p-4 md:p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle size={15} /> {error}
                                </div>
                            )}
                            <div
                                className="rounded-xl p-4 min-w-0"
                                style={{ backgroundColor: "var(--bg-primary)" }}
                            >
                                <p
                                    className="text-sm font-medium break-words"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {editing.student.full_name}
                                </p>
                                <p
                                    className="text-xs mt-0.5 break-words"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    {editing.student.document_type}{" "}
                                    {editing.student.document_number} · {editing.program.name}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    {
                                        key: "enrollment_number",
                                        label: "N° Matrícula",
                                        placeholder: "Ej: 001",
                                    },
                                    { key: "folio", label: "Folio", placeholder: "Ej: 01" },
                                    {
                                        key: "year",
                                        label: "Año",
                                        placeholder: new Date().getFullYear().toString(),
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
                                            type="text"
                                            value={editForm[key]}
                                            onChange={(e) =>
                                                setEditForm((p) => ({ ...p, [key]: e.target.value }))
                                            }
                                            placeholder={placeholder}
                                            className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                            style={{
                                                borderColor: "var(--border-color)",
                                                backgroundColor: "var(--bg-primary)",
                                                color: "var(--text-primary)",
                                            }}
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Tipo de certificado
                                    </label>
                                    <select
                                        value={editForm.certificate_type}
                                        onChange={(e) =>
                                            setEditForm((p) => ({
                                                ...p,
                                                certificate_type: e.target.value,
                                            }))
                                        }
                                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                                        style={{
                                            borderColor: "var(--border-color)",
                                            backgroundColor: "var(--bg-primary)",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        <option value="">
                                            Igual al del programa
                                            {editing.program.certificate_type
                                                ? ` (${editing.program.certificate_type})`
                                                : ""}
                                        </option>
                                        {CERTIFICATE_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                        {editForm.certificate_type &&
                                            !CERTIFICATE_TYPES.includes(editForm.certificate_type) && (
                                                <option value={editForm.certificate_type}>
                                                    {editForm.certificate_type}
                                                </option>
                                            )}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditing(null)}
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
                                    {saving ? "Guardando..." : "Guardar cambios"}
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
                            className="flex items-center justify-between p-4 md:p-6 border-b sticky top-0"
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
                        <div className="p-4 md:p-6 space-y-4">
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
                            {Object.values(lr002Data).some((v) => v === true) && (
                                <div
                                    className="rounded-xl p-3 border text-xs font-medium"
                                    style={{
                                        backgroundColor: "#fffbeb",
                                        borderColor: "#fde68a",
                                        color: "#b45309",
                                    }}
                                >
                                    Estudiante menor de edad: se incluyen los datos del
                                    representante legal.
                                </div>
                            )}
                            {Object.entries(lr002Data)
                                .filter(([, value]) => typeof value !== "boolean")
                                .map(([key, value]) => (
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
        </div>
    );
}
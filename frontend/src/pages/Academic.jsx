import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import StudentsTab from "../components/academic/StudentsTab";
import ProgramsTab from "../components/academic/ProgramsTab";
import EnrollmentsTab from "../components/academic/EnrollmentsTab";
import NotificationBell from "../components/NotificationBell";
import {
    GraduationCap,
    BookOpen,
    ClipboardList,
    Bell,
    CheckCircle,
    AlertCircle,
    Circle,
} from "lucide-react";


const STEPS = [
    {
        key: "estudiantes",
        label: "Estudiantes",
        hint: "Carga tus estudiantes con su programa o nivel",
        icon: GraduationCap,
    },
    {
        key: "programas",
        label: "Programas",
        hint: "Completa resolución, horas y tipo de certificado",
        icon: BookOpen,
    },
    {
        key: "matriculas",
        label: "Matrículas",
        hint: "Completa número de matrícula y folio",
        icon: ClipboardList,
    },
];

const TONES = {
    ok: { color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
    warn: { color: "#b45309", bg: "#fef3c7", icon: AlertCircle },
    empty: {
        color: "var(--text-secondary)",
        bg: "var(--bg-primary)",
        icon: Circle,
    },
};

export default function Academic() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [showLogout, setShowLogout] = useState(false);
    const [showInactivity, setShowInactivity] = useState(false);
    const [summary, setSummary] = useState(null);

    const tabParam = searchParams.get("tab");
    const activeTab = STEPS.some((s) => s.key === tabParam)
        ? tabParam
        : "estudiantes";

    useInactivity({
        timeout: 30,
        onWarning: () => setShowInactivity(true),
        onLogout: () => {
            setShowInactivity(false);
            logout();
            navigate("/");
        },
    });

    // Resumen para calcular el estado de cada paso.
    // Cada pestaña llama a fetchSummary (onChange) al guardar cambios.
    const fetchSummary = useCallback(async () => {
        try {
            const [s, p, e] = await Promise.all([
                api.get("/students/"),
                api.get("/programs/"),
                api.get("/enrollments/"),
            ]);
            setSummary({
                students: s.data.length,
                programs: p.data,
                enrollments: e.data,
            });
        } catch {
            setSummary(null); // sin resumen, los pasos se muestran sin estado
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const getStatus = (key) => {
        if (!summary) return null;
        if (key === "estudiantes") {
            return summary.students === 0
                ? { tone: "empty", text: "Aún sin estudiantes" }
                : { tone: "ok", text: `${summary.students} registrados` };
        }
        if (key === "programas") {
            if (summary.programs.length === 0)
                return { tone: "empty", text: "Se crean al cargar estudiantes" };
            const incomplete = summary.programs.filter(
                (p) => !p.resolution || !p.total_hours,
            ).length;
            return incomplete > 0
                ? {
                    tone: "warn",
                    text: `${incomplete} sin resolución u horas`,
                }
                : { tone: "ok", text: "Programas completos" };
        }
        if (summary.enrollments.length === 0)
            return { tone: "empty", text: "Se generan al cargar estudiantes" };
        const noFolio = summary.enrollments.filter((e) => !e.folio).length;
        return noFolio > 0
            ? { tone: "warn", text: `${noFolio} sin folio` }
            : { tone: "ok", text: "Matrículas completas" };
    };

    // Si el paso de matrículas tiene pendientes de folio, abre ya filtrado
    const goToTab = (key) => {
        const status = getStatus(key);
        if (key === "matriculas" && status?.tone === "warn") {
            setSearchParams({ tab: key, folio: "sin" });
        } else {
            setSearchParams({ tab: key });
        }
    };

    return (
        <div
            className="min-h-screen flex"
            style={{ backgroundColor: "var(--bg-primary)" }}
        >
            <Sidebar onLogout={() => setShowLogout(true)} />

            <main className="md:ml-56 flex-1 flex flex-col min-w-0">
                <header
                    className="border-b pl-16 pr-4 md:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-10"
                    style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                    }}
                >
                    <div className="min-w-0 flex-1">
                        <h1
                            className="text-lg font-semibold truncate"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Gestión académica
                        </h1>
                        <p
                            className="text-xs truncate"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            Estudiantes, programas y matrículas de tu institución
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <NotificationBell />
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
                                className="hidden xs:block text-sm font-medium truncate max-w-[140px]"
                                style={{ color: "var(--text-primary)" }}
                            >
                                {user?.full_name}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 md:p-8">
                    {/* Paso a paso */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                        {STEPS.map((step, index) => {
                            const isActive = step.key === activeTab;
                            const status = getStatus(step.key);
                            const tone = status ? TONES[status.tone] : null;
                            const ToneIcon = tone?.icon;
                            return (
                                <button
                                    key={step.key}
                                    onClick={() => goToTab(step.key)}
                                    className="text-left rounded-xl border p-4 transition-colors min-w-0"
                                    style={{
                                        backgroundColor: isActive
                                            ? "var(--color-primary-light)"
                                            : "var(--bg-secondary)",
                                        borderColor: isActive
                                            ? "var(--color-primary)"
                                            : "var(--border-color)",
                                    }}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={{
                                                backgroundColor: isActive
                                                    ? "var(--color-primary)"
                                                    : "var(--bg-primary)",
                                                color: isActive ? "#fff" : "var(--text-secondary)",
                                            }}
                                        >
                                            {index + 1}
                                        </div>
                                        <p
                                            className="text-sm font-semibold truncate"
                                            style={{ color: "var(--text-primary)" }}
                                        >
                                            {step.label}
                                        </p>
                                    </div>
                                    <p
                                        className="text-xs mt-2"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        {step.hint}
                                    </p>
                                    {status && (
                                        <span
                                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium mt-3 max-w-full"
                                            style={{ backgroundColor: tone.bg, color: tone.color }}
                                        >
                                            <ToneIcon size={12} className="flex-shrink-0" />
                                            <span className="truncate">{status.text}</span>
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Contenido del paso activo */}
                    {activeTab === "estudiantes" && <StudentsTab onChange={fetchSummary} />}
                    {activeTab === "programas" && <ProgramsTab onChange={fetchSummary} />}
                    {activeTab === "matriculas" && <EnrollmentsTab onChange={fetchSummary} />}
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
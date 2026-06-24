import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import EduBot from "../components/EduBot";
import {
  FileText,
  Plus,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Shield,
  Bell,
  FilePen,
  Award,
  BarChart3,
  ClipboardList,
  GraduationCap,
  BookOpen,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Users,
} from "lucide-react";

const STATUS_STYLES = {
  generated: {
    bg: "var(--color-primary-light)",
    color: "var(--color-primary)",
  },
  draft: { bg: "#f3f4f6", color: "#6b7280" },
  ai_draft: { bg: "#fef3c7", color: "#b45309" },
  cancelled: { bg: "#fee2e2", color: "#dc2626" },
};

const STATUS_LABELS = {
  generated: "Generado",
  draft: "Borrador",
  ai_draft: "Borrador IA",
  cancelled: "Cancelado",
};

const STATUS_ICONS = {
  generated: CheckCircle,
  draft: FilePen,
  ai_draft: Clock,
  cancelled: XCircle,
};

const PLAN_LIMITS = {
  free: 10,
  basic: 50,
  professional: 200,
  enterprise: Infinity,
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [students, setStudents] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
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
    const fetchData = async () => {
      try {
        const [docsRes, templatesRes, programsRes, studentsRes, subRes] =
          await Promise.all([
            api.get("/documents/"),
            api.get("/templates/"),
            api.get("/programs/"),
            api.get("/students/"),
            api.get("/subscriptions/my").catch(() => ({ data: null })),
          ]);
        setDocuments(docsRes.data);
        setTemplates(templatesRes.data);
        setPrograms(programsRes.data);
        setStudents(studentsRes.data);
        setSubscription(subRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Métricas calculadas
  const now = new Date();
  const thisMonth = documents.filter((d) => {
    const date = new Date(d.created_at);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });
  const lastMonth = documents.filter((d) => {
    const date = new Date(d.created_at);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return (
      date.getMonth() === lm.getMonth() &&
      date.getFullYear() === lm.getFullYear()
    );
  });

  const docsThisMonth = thisMonth.length;
  const docsLastMonth = lastMonth.length;
  const docsDelta =
    docsLastMonth > 0
      ? Math.round(((docsThisMonth - docsLastMonth) / docsLastMonth) * 100)
      : null;
  const pendingDrafts = documents.filter((d) => d.status === "ai_draft").length;
  const generatedCount = documents.filter(
    (d) => d.status === "generated",
  ).length;

  const planName = subscription?.plan?.name || "free";
  const planLimit = PLAN_LIMITS[planName] ?? 10;
  const planLabel =
    {
      free: "Free",
      basic: "Básico",
      professional: "Profesional",
      enterprise: "Empresarial",
    }[planName] || "Free";
  const usagePercent =
    planLimit === Infinity
      ? 0
      : Math.min((docsThisMonth / planLimit) * 100, 100);
  const usageColor =
    usagePercent >= 90
      ? "#dc2626"
      : usagePercent >= 70
        ? "#f59e0b"
        : "var(--color-primary)";

  const getTemplateName = (templateId) => {
    const t = templates.find((t) => t.id === templateId);
    return t?.name || templateId;
  };

  // Documentos recientes ordenados por fecha
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Distribución por estado
  const statusCounts = {
    generated: generatedCount,
    draft: documents.filter((d) => d.status === "draft").length,
    ai_draft: pendingDrafts,
    cancelled: documents.filter((d) => d.status === "cancelled").length,
  };

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
          <h1
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Panel de Control
          </h1>
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <Bell size={20} />
              {pendingDrafts > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
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
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user?.full_name}
                </p>
                <p
                  className="text-xs capitalize"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">
          {/* Banner bienvenida */}
          <div
            className="rounded-2xl p-8 mb-8 flex items-center justify-between"
            style={{
              background: `linear-gradient(to right, var(--color-banner-from), var(--color-banner-to))`,
            }}
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                ¡Bienvenido, {user?.full_name?.split(" ")[0]}!
              </h2>
              <p className="text-white/80 mb-6">
                Gestiona los documentos reglamentarios de tu institución desde
                aquí.
              </p>
              <button
                onClick={() => navigate("/documentos/nuevo")}
                className="bg-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors hover:opacity-90"
                style={{ color: "var(--color-primary)" }}
              >
                <Plus size={18} /> Generar documento
              </button>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-3 text-white/70 text-sm">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
                <FileText size={16} className="text-white" />
                <span className="text-white font-medium">
                  {docsThisMonth} docs este mes
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
                <BookOpen size={16} className="text-white" />
                <span className="text-white font-medium">
                  {programs.length} programas activos
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
                <GraduationCap size={16} className="text-white" />
                <span className="text-white font-medium">
                  {students.length} estudiantes
                </span>
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Docs este mes */}
            <div
              className="rounded-xl p-5 border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs uppercase tracking-wide"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Este mes
                </span>
                <TrendingUp size={14} style={{ color: "var(--color-icon)" }} />
              </div>
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {docsThisMonth}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {docsDelta !== null ? (
                  <>
                    {docsDelta >= 0 ? (
                      <TrendingUp size={12} className="text-green-500" />
                    ) : (
                      <TrendingDown size={12} className="text-red-500" />
                    )}
                    <p
                      className="text-xs"
                      style={{ color: docsDelta >= 0 ? "#16a34a" : "#dc2626" }}
                    >
                      {docsDelta >= 0 ? "+" : ""}
                      {docsDelta}% vs mes anterior
                    </p>
                  </>
                ) : (
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    documentos generados
                  </p>
                )}
              </div>
            </div>

            {/* Generados totales */}
            <div
              className="rounded-xl p-5 border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs uppercase tracking-wide"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Generados
                </span>
                <CheckCircle size={14} className="text-green-500" />
              </div>
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {generatedCount}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {documents.length} en total
              </p>
            </div>

            {/* Programas y estudiantes */}
            <div
              className="rounded-xl p-5 border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs uppercase tracking-wide"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Programas
                </span>
                <BookOpen size={14} style={{ color: "var(--color-icon)" }} />
              </div>
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {programs.length}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {students.length} estudiantes registrados
              </p>
            </div>

            {/* Borradores pendientes */}
            <div
              className="rounded-xl p-5 border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor:
                  pendingDrafts > 0 ? "#fbbf24" : "var(--border-color)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs uppercase tracking-wide"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Borradores IA
                </span>
                <Clock
                  size={14}
                  style={{
                    color: pendingDrafts > 0 ? "#f59e0b" : "var(--color-icon)",
                  }}
                />
              </div>
              <p
                className="text-3xl font-bold"
                style={{
                  color: pendingDrafts > 0 ? "#f59e0b" : "var(--text-primary)",
                }}
              >
                {pendingDrafts}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {pendingDrafts > 0
                  ? "Pendientes de revisión"
                  : "Sin borradores pendientes"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Documentos recientes */}
            <div
              className="lg:col-span-2 rounded-xl border p-6"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Documentos recientes
                </h3>
                <button
                  onClick={() => navigate("/documentos")}
                  className="text-sm flex items-center gap-1 hover:underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  Ver todos <ArrowRight size={14} />
                </button>
              </div>

              {loading ? (
                <div
                  className="text-center py-8 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cargando...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: "var(--color-primary-light)" }}
                  >
                    <FileText
                      size={32}
                      style={{ color: "var(--color-icon)" }}
                    />
                  </div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Sin documentos aún
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Genera tu primer documento reglamentario
                  </p>
                  <button
                    onClick={() => navigate("/documentos/nuevo")}
                    className="mt-4 text-sm font-medium hover:underline"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Generar ahora →
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div
                    className="grid grid-cols-12 text-xs uppercase tracking-wide pb-2 border-b px-2"
                    style={{
                      color: "var(--text-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <span className="col-span-5">Documento</span>
                    <span className="col-span-3">Estado</span>
                    <span className="col-span-4">Fecha</span>
                  </div>
                  {recentDocs.map((doc) => {
                    const StatusIcon = STATUS_ICONS[doc.status] || FileText;
                    return (
                      <div
                        key={doc.id}
                        className="grid grid-cols-12 items-center py-2.5 rounded-lg px-2 transition-colors"
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--bg-primary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        <div className="col-span-5 flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: "var(--color-primary-light)",
                            }}
                          >
                            <FileText
                              size={12}
                              style={{ color: "var(--color-icon)" }}
                            />
                          </div>
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {getTemplateName(doc.template_id)}
                          </p>
                        </div>
                        <div className="col-span-3">
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: STATUS_STYLES[doc.status]?.bg,
                              color: STATUS_STYLES[doc.status]?.color,
                            }}
                          >
                            <StatusIcon size={10} />
                            {STATUS_LABELS[doc.status]}
                          </span>
                        </div>
                        <span
                          className="col-span-4 text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {new Date(doc.created_at).toLocaleDateString(
                            "es-CO",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Panel derecho */}
            <div className="space-y-4">
              {/* Uso del plan */}
              <div
                className="rounded-xl border p-5"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p
                      className="text-xs uppercase tracking-wide mb-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Plan {planLabel}
                    </p>
                    <p
                      className="font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Uso este mes
                    </p>
                  </div>
                  <Shield size={18} style={{ color: "var(--color-icon)" }} />
                </div>

                <div className="flex items-end gap-1 mb-2">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {docsThisMonth}
                  </span>
                  <span
                    className="text-sm mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    / {planLimit === Infinity ? "∞" : planLimit}
                  </span>
                </div>

                <div
                  className="w-full rounded-full h-2 mb-1"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${usagePercent}%`,
                      backgroundColor: usageColor,
                    }}
                  />
                </div>
                <p
                  className="text-xs"
                  style={{
                    color:
                      usagePercent >= 90 ? "#dc2626" : "var(--text-secondary)",
                  }}
                >
                  {planLimit === Infinity
                    ? "Documentos ilimitados"
                    : usagePercent >= 90
                      ? "⚠️ Casi en el límite"
                      : `${planLimit - docsThisMonth} documentos restantes`}
                </p>

                {planName !== "enterprise" && (
                  <button
                    onClick={() => navigate("/suscripcion")}
                    className="mt-3 w-full text-xs font-medium py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Mejorar plan →
                  </button>
                )}
              </div>

              {/* Distribución por estado */}
              {documents.length > 0 && (
                <div
                  className="rounded-xl border p-5"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <p
                    className="font-semibold mb-4 text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Por estado
                  </p>
                  <div className="space-y-2.5">
                    {Object.entries(statusCounts)
                      .filter(([, count]) => count > 0)
                      .map(([status, count]) => {
                        const style = STATUS_STYLES[status];
                        const Icon = STATUS_ICONS[status];
                        const pct = Math.round(
                          (count / documents.length) * 100,
                        );
                        return (
                          <div key={status}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <Icon
                                  size={11}
                                  style={{ color: style.color }}
                                />
                                <span
                                  className="text-xs"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {STATUS_LABELS[status]}
                                </span>
                              </div>
                              <span
                                className="text-xs font-medium"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {count}
                              </span>
                            </div>
                            <div
                              className="w-full rounded-full h-1.5"
                              style={{ backgroundColor: "var(--bg-primary)" }}
                            >
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: style.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Accesos directos */}
              <div
                className="rounded-xl border p-5"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <p
                  className="font-semibold mb-3 text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Accesos directos
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Nuevo doc",
                      icon: FilePen,
                      path: "/documentos/nuevo",
                    },
                    {
                      label: "Certificado",
                      icon: Award,
                      path: "/documentos/nuevo",
                    },
                    {
                      label: "Matrículas",
                      icon: ClipboardList,
                      path: "/matriculas",
                    },
                    {
                      label: "Estudiantes",
                      icon: GraduationCap,
                      path: "/estudiantes",
                    },
                  ].map(({ label, icon: Icon, path }) => (
                    <button
                      key={label}
                      onClick={() => navigate(path)}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-colors"
                      style={{ backgroundColor: "var(--bg-primary)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--color-primary-light)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--bg-primary)")
                      }
                    >
                      <Icon size={20} style={{ color: "var(--color-icon)" }} />
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
    </div>
  );
}

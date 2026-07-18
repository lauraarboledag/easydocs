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
  TrendingUp,
  TrendingDown,
  Shield,
  Bell,
  FilePen,
  Award,
  ClipboardList,
  GraduationCap,
  BookOpen,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  CalendarDays,
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

const PLAN_LABELS = {
  free: "Free",
  basic: "Básico",
  professional: "Profesional",
  enterprise: "Empresarial",
};

function MetricCard({ label, value, sub, icon: Icon, iconColor, alert }) {
  return (
    <div
      className="rounded-xl p-5 border"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: alert ? "#fbbf24" : "var(--border-color)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs uppercase tracking-wide"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </span>
        <Icon size={14} style={{ color: iconColor || "var(--color-icon)" }} />
      </div>
      <p
        className="text-3xl font-bold"
        style={{ color: alert ? "#f59e0b" : "var(--text-primary)" }}
      >
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
        {sub}
      </p>
    </div>
  );
}

function BannerClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const s = time.getSeconds();
  const m = time.getMinutes();
  const h = time.getHours() % 12;

  const toXY = (deg, len) => ({
    x: 60 + len * Math.cos(((deg - 90) * Math.PI) / 180),
    y: 60 + len * Math.sin(((deg - 90) * Math.PI) / 180),
  });

  const hTip = toXY(h * 30 + m * 0.5, 28);
  const mTip = toXY(m * 6 + s * 0.1, 38);
  const sTip = toXY(s * 6, 42);
  const sTail = toXY(s * 6 + 180, 10);

  const timeStr = time.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = time.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="flex items-center gap-4 flex-shrink-0">
      <svg width="90" height="90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="var(--bg-primary)"
          stroke="var(--color-primary)"
          strokeWidth="2"
          opacity="0.3"
        />
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const major = i % 3 === 0;
          return (
            <circle
              key={i}
              cx={60 + (major ? 46 : 47) * Math.cos(angle)}
              cy={60 + (major ? 46 : 47) * Math.sin(angle)}
              r={major ? 3.5 : 2}
              fill="var(--color-primary)"
              opacity={major ? 0.8 : 0.3}
            />
          );
        })}
        <line
          x1="60"
          y1="60"
          x2={hTip.x}
          y2={hTip.y}
          stroke="var(--text-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          x1="60"
          y1="60"
          x2={mTip.x}
          y2={mTip.y}
          stroke="var(--text-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1={sTail.x}
          y1={sTail.y}
          x2={sTip.x}
          y2={sTip.y}
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="60" cy="60" r="3" fill="var(--color-primary)" />
      </svg>
      <div>
        <p
          className="text-3xl font-bold font-mono"
          style={{ color: "var(--text-primary)" }}
        >
          {timeStr}
        </p>
        <p
          className="text-xs mt-1 capitalize"
          style={{ color: "var(--text-secondary)" }}
        >
          {dateStr}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [students, setStudents] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
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
        const [
          docsRes,
          templatesRes,
          programsRes,
          studentsRes,
          subRes,
          eventsRes,
        ] = await Promise.all([
          api.get("/documents/"),
          api.get("/templates/"),
          api.get("/programs/"),
          api.get("/students/"),
          api.get("/subscriptions/my").catch(() => ({ data: null })),
          api.get("/calendar/").catch(() => ({ data: [] })),
        ]);
        setDocuments(docsRes.data);
        setTemplates(templatesRes.data);
        setPrograms(programsRes.data);
        setStudents(studentsRes.data);
        setSubscription(subRes.data);
        const todayStr = new Date().toISOString().split("T")[0];
        setUpcomingEvents(
          eventsRes.data
            .filter((e) => e.event_date >= todayStr && !e.is_done)
            .slice(0, 3),
        );
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Refrescar eventos al volver al dashboard
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchEvents();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/calendar/").catch(() => ({ data: [] }));
      const todayStr = new Date().toISOString().split("T")[0];
      setUpcomingEvents(
        res.data
          .filter((e) => e.event_date >= todayStr && !e.is_done)
          .slice(0, 3),
      );
    } catch {
      // silencioso
    }
  };

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
  const planLabel = PLAN_LABELS[planName] || "Free";
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

  const getTemplateName = (templateId) =>
    templates.find((t) => t.id === templateId)?.name || templateId;

  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const statusCounts = {
    generated: generatedCount,
    draft: documents.filter((d) => d.status === "draft").length,
    ai_draft: pendingDrafts,
    cancelled: documents.filter((d) => d.status === "cancelled").length,
  };

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const nextEvent = upcomingEvents[0];

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="ml-56 flex-1 flex flex-col">
        <header
          className="border-b px-8 py-4 flex items-center justify-between sticky top-0 z-20"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          <div>
            <h1
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Panel de Control
            </h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {user?.institution?.name || "Vista general"}
            </p>
          </div>
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
          {/* Banner */}
          <div
            className="rounded-2xl p-8 mb-8 relative overflow-hidden border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--color-primary)",
              borderWidth: "1.5px",
            }}
          >
            {/* Círculos decorativos */}
            <div
              className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-5"
              style={{ backgroundColor: "var(--color-primary)" }}
            />
            <div
              className="absolute -bottom-16 right-32 w-64 h-64 rounded-full opacity-5"
              style={{ backgroundColor: "var(--color-primary)" }}
            />

            {/* Fila superior — saludo + reloj */}
            <div className="relative z-10 flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white shadow-sm"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {greeting}
                  </p>
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user?.full_name?.split(" ")[0]}
                  </h2>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {upcomingEvents.length > 0
                      ? `${upcomingEvents.length} evento${upcomingEvents.length !== 1 ? "s" : ""} pendiente${upcomingEvents.length !== 1 ? "s" : ""} — ${nextEvent.title}`
                      : "No tienes eventos próximos"}
                  </p>
                </div>
              </div>

              <BannerClock />
            </div>

            {/* Fila inferior — accesos directos + calendario */}
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                {
                  label: "Nuevo documento",
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
                  className="flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    borderColor: "var(--border-color)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-primary-light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--color-primary-light)" }}
                  >
                    <Icon size={15} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {label}
                  </span>
                </button>
              ))}

              <button
                onClick={() => navigate("/calendario")}
                className="flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all"
                style={{
                  backgroundColor: "var(--color-primary)",
                  borderColor: "var(--color-primary)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/20">
                  <CalendarDays size={15} className="text-white" />
                </div>
                <span className="text-xs font-medium text-white">
                  Calendario
                </span>
              </button>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                      {docsDelta}
                      {"% vs mes anterior"}
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

            <MetricCard
              label="Generados"
              value={generatedCount}
              sub={`${documents.length} en total`}
              icon={CheckCircle}
              iconColor="#16a34a"
            />
            <MetricCard
              label="Programas"
              value={programs.length}
              sub={`${students.length} estudiantes`}
              icon={BookOpen}
            />
            <MetricCard
              label="Borradores IA"
              value={pendingDrafts}
              sub={
                pendingDrafts > 0 ? "Pendientes de revisión" : "Sin borradores"
              }
              icon={Clock}
              iconColor={pendingDrafts > 0 ? "#f59e0b" : "var(--color-icon)"}
              alert={pendingDrafts > 0}
            />
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
                    {"Generar ahora \u2192"}
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
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Panel lateral derecho */}
            <div className="space-y-4">
              {/* Próximos eventos */}
              <div
                className="rounded-xl border p-5"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Próximos eventos
                  </p>
                  <button
                    onClick={() => navigate("/calendario")}
                    className="text-xs flex items-center gap-1 hover:underline"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Ver calendario <ArrowRight size={12} />
                  </button>
                </div>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-4">
                    <CalendarDays
                      size={20}
                      className="mx-auto mb-2 opacity-30"
                      style={{ color: "var(--text-secondary)" }}
                    />
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Sin eventos próximos
                    </p>
                    <button
                      onClick={() => navigate("/calendario")}
                      className="text-xs mt-2 hover:underline"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {"Agregar evento \u2192"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-start gap-3 p-2.5 rounded-lg"
                        style={{ backgroundColor: "var(--bg-primary)" }}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        />
                        <div>
                          <p
                            className="text-xs font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {ev.title}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {new Date(ev.event_date).toLocaleDateString(
                              "es-CO",
                              { day: "2-digit", month: "short" },
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                      className="font-bold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Uso este mes
                    </p>
                  </div>
                  <Shield size={16} style={{ color: "var(--color-icon)" }} />
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
                    {"/ "}
                    {planLimit === Infinity ? "\u221E" : planLimit}
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
                      ? "\u26A0\uFE0F Casi en el límite"
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
                    {"Mejorar plan \u2192"}
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import AdminSidebar from "../components/layout/AdminSidebar";
import useInactivity from "../hooks/useInactivity";
import InactivityModal from "../components/InactivityModal";
import {
  Building2,
  CreditCard,
  Bell,
  TrendingUp,
  CheckCircle,
  Clock,
  Shield,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Users,
  ChevronRight,
} from "lucide-react";

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

function PendingTransactionItem({ transaction, onConfirm }) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl transition-colors"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#fef3c7" }}
        >
          <Clock size={16} className="text-yellow-600" />
        </div>
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            ${(transaction.amount / 100).toLocaleString("es-CO")} COP
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {new Date(transaction.created_at).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
        >
          Pendiente
        </span>
        <button
          onClick={() => onConfirm(transaction.id)}
          className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
        >
          <CheckCircle size={12} /> Confirmar
        </button>
      </div>
    </div>
  );
}

function InstitutionItem({ inst }) {
  return (
    <div
      className="flex items-center justify-between py-2.5 border-b last:border-0"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--color-primary-light)" }}
        >
          <Building2 size={14} style={{ color: "var(--color-icon)" }} />
        </div>
        <div>
          <p
            className="text-sm font-medium truncate max-w-32"
            style={{ color: "var(--text-primary)" }}
          >
            {inst.name}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {inst.municipality}
          </p>
        </div>
      </div>
      <div
        className={`w-2 h-2 rounded-full ${inst.is_active ? "bg-green-400" : "bg-gray-300"}`}
      />
    </div>
  );
}

function AdminBannerClock() {
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

  return (
    <div className="flex items-center gap-4 flex-shrink-0">
      <svg width="90" height="90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="var(--bg-primary)"
          stroke="#f59e0b"
          strokeWidth="2"
          opacity="0.4"
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
              fill="#f59e0b"
              opacity={major ? 0.9 : 0.3}
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
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="60" cy="60" r="3" fill="#f59e0b" />
      </svg>
      <div>
        <p
          className="text-3xl font-bold font-mono"
          style={{ color: "var(--text-primary)" }}
        >
          {time.toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p
          className="text-xs mt-1 capitalize"
          style={{ color: "var(--text-secondary)" }}
        >
          {time.toLocaleDateString("es-CO", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instRes, transRes, plansRes] = await Promise.all([
          api.get("/institutions/"),
          api.get("/transactions/"),
          api.get("/plans/"),
        ]);
        setInstitutions(instRes.data);
        setTransactions(transRes.data);
        setPlans(plansRes.data);
      } catch {
        setError("Error cargando datos. Recarga la página.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchEvents();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchEvents();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useInactivity({
    timeout: 30,
    onWarning: () => setShowInactivity(true),
    onLogout: () => {
      setShowInactivity(false);
      logout();
      navigate("/");
    },
  });

  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending",
  );
  const confirmedTransactions = transactions.filter(
    (t) => t.status === "confirmed",
  );
  const nextEvent = upcomingEvents[0];

  const handleConfirmTransaction = async (transactionId) => {
    try {
      await api.patch(`/transactions/${transactionId}/confirm`, {
        notes: "Confirmado desde panel admin",
      });
      const res = await api.get("/transactions/");
      setTransactions(res.data);
    } catch {
      setError("Error confirmando la transacción. Intenta de nuevo.");
    }
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <AdminSidebar onLogout={() => setShowLogout(true)} />

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
              Panel de Administración
            </h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              EduDynamis — Vista global de la plataforma
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <Bell size={20} />
              {pendingTransactions.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user?.full_name}
                </p>
                <p className="text-xs font-medium text-yellow-600">
                  Superadmin
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* Banner */}
          <div
            className="rounded-2xl p-8 mb-8 relative overflow-hidden border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "#f59e0b",
              borderWidth: "1.5px",
            }}
          >
            {/* Círculos decorativos */}
            <div
              className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-5"
              style={{ backgroundColor: "#f59e0b" }}
            />
            <div
              className="absolute -bottom-16 right-32 w-64 h-64 rounded-full opacity-5"
              style={{ backgroundColor: "#f59e0b" }}
            />

            {/* Fila superior — saludo + reloj */}
            <div className="relative z-10 flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white shadow-sm bg-yellow-500">
                  <Shield size={28} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1 text-yellow-600">
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
                    {pendingTransactions.length > 0
                      ? `${pendingTransactions.length} transacción${pendingTransactions.length !== 1 ? "es" : ""} pendiente${pendingTransactions.length !== 1 ? "s" : ""} de confirmación`
                      : nextEvent
                        ? `Próximo evento: ${nextEvent.title}`
                        : "Todo al día — sin pendientes"}
                  </p>
                </div>
              </div>
              <AdminBannerClock />
            </div>

            {/* Fila inferior — accesos directos */}
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                {
                  label: "Instituciones",
                  icon: Building2,
                  path: "/admin/instituciones",
                },
                {
                  label: "Transacciones",
                  icon: CreditCard,
                  path: "/admin/transacciones",
                },
                {
                  label: "Plantillas",
                  icon: Shield,
                  path: "/admin/plantillas",
                },
                { label: "Planes", icon: TrendingUp, path: "/admin/planes" },
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
                    e.currentTarget.style.borderColor = "#f59e0b";
                    e.currentTarget.style.backgroundColor = "#fef9c3";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                  }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-yellow-100">
                    <Icon size={15} className="text-yellow-600" />
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
                onClick={() => navigate("/admin/calendario")}
                className="flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all bg-yellow-500 border-yellow-500"
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
            <MetricCard
              label="Instituciones"
              value={institutions.length}
              sub={`${institutions.filter((i) => i.is_active).length} activas`}
              icon={Building2}
              iconColor="var(--color-primary)"
            />
            <MetricCard
              label="Planes"
              value={plans.length}
              sub="Disponibles"
              icon={CreditCard}
              iconColor="var(--color-primary)"
            />
            <MetricCard
              label="Pendientes"
              value={pendingTransactions.length}
              sub="Sin confirmar"
              icon={Clock}
              iconColor={
                pendingTransactions.length > 0 ? "#f59e0b" : "var(--color-icon)"
              }
              alert={pendingTransactions.length > 0}
            />
            <MetricCard
              label="Confirmadas"
              value={confirmedTransactions.length}
              sub="Este período"
              icon={TrendingUp}
              iconColor="#16a34a"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transacciones pendientes */}
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
                  Transacciones pendientes
                </h3>
                <button
                  onClick={() => navigate("/admin/transacciones")}
                  className="text-sm flex items-center gap-1 hover:underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  Ver todas <ArrowRight size={14} />
                </button>
              </div>

              {loading ? (
                <div
                  className="text-center py-8 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cargando...
                </div>
              ) : pendingTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Todo al día
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    No hay transacciones pendientes
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTransactions.slice(0, 5).map((transaction) => (
                    <PendingTransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onConfirm={handleConfirmTransaction}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Panel lateral */}
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
                    onClick={() => navigate("/admin/calendario")}
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
                      onClick={() => navigate("/admin/calendario")}
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
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 bg-yellow-500" />
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

              {/* Instituciones recientes */}
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
                    Instituciones recientes
                  </p>
                  <button
                    onClick={() => navigate("/admin/instituciones")}
                    className="text-xs hover:underline"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Ver todas
                  </button>
                </div>
                {loading ? (
                  <p
                    className="text-xs text-center py-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Cargando...
                  </p>
                ) : institutions.length === 0 ? (
                  <div className="text-center py-4">
                    <Building2
                      size={20}
                      className="mx-auto mb-2 opacity-30"
                      style={{ color: "var(--text-secondary)" }}
                    />
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Sin instituciones aún
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {institutions.slice(0, 4).map((inst) => (
                      <InstitutionItem key={inst.id} inst={inst} />
                    ))}
                  </div>
                )}
                <button
                  onClick={() => navigate("/admin/instituciones")}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors border"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--bg-primary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  Ver todas <ChevronRight size={14} />
                </button>
              </div>

              {/* Resumen plataforma */}
              <div
                className="rounded-xl border p-5"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <p
                  className="font-semibold text-sm mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  Resumen plataforma
                </p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Instituciones activas",
                      value: institutions.filter((i) => i.is_active).length,
                      icon: Building2,
                    },
                    {
                      label: "Instituciones inactivas",
                      value: institutions.filter((i) => !i.is_active).length,
                      icon: Users,
                    },
                    {
                      label: "Planes disponibles",
                      value: plans.length,
                      icon: CreditCard,
                    },
                    {
                      label: "Total transacciones",
                      value: transactions.length,
                      icon: TrendingUp,
                    },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          size={13}
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {label}
                        </span>
                      </div>
                      <span
                        className="text-xs font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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

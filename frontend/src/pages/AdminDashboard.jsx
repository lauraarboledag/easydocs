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
  XCircle,
  ChevronRight,
  Shield,
  AlertCircle,
  ArrowRight,
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
        <Icon size={14} style={{ color: iconColor }} />
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

function TransactionAmount({ amount, date }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: "#fef3c7" }}
      >
        <Clock size={16} className="text-yellow-600" />
      </div>
      <div>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          ${(amount / 100).toLocaleString("es-CO")} COP
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {new Date(date).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

function PendingTransactionItem({ transaction, onConfirm }) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <TransactionAmount
        amount={transaction.amount}
        date={transaction.created_at}
      />
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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <AdminSidebar onLogout={() => setShowLogout(true)} />

      <main className="ml-56 flex-1 flex flex-col">
        {/* Topbar */}
        <header
          className="border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10"
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
          {/* Banner */}
          <div
            className="rounded-2xl p-8 mb-8 flex items-center justify-between"
            style={{
              background:
                "linear-gradient(to right, var(--color-banner-from), var(--color-banner-to))",
            }}
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Bienvenido, {user?.full_name?.split(" ")[0]}
              </h2>
              <p className="text-white/80">
                Tienes{" "}
                <strong className="text-white">
                  {pendingTransactions.length}
                </strong>{" "}
                {pendingTransactions.length === 1
                  ? "transacción pendiente"
                  : "transacciones pendientes"}{" "}
                de confirmación.
              </p>
            </div>
            {pendingTransactions.length > 0 && (
              <button
                onClick={() => navigate("/admin/transacciones")}
                className="bg-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-colors"
                style={{ color: "var(--color-primary)" }}
              >
                <AlertCircle size={18} />
                Revisar ahora
              </button>
            )}
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Instituciones"
              value={institutions.length}
              sub="Registradas"
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

            {/* Instituciones recientes */}
            <div
              className="rounded-xl border p-6"
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
                  Instituciones
                </h3>
                <button
                  onClick={() => navigate("/admin/instituciones")}
                  className="text-sm hover:underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  Ver todas
                </button>
              </div>

              {loading ? (
                <div
                  className="text-center py-8 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cargando...
                </div>
              ) : institutions.length === 0 ? (
                <div className="text-center py-8">
                  <Building2
                    size={32}
                    className="mx-auto mb-3"
                    style={{ color: "var(--text-secondary)", opacity: 0.4 }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Sin instituciones aún
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {institutions.slice(0, 5).map((inst) => (
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
                  (e.currentTarget.style.backgroundColor = "var(--bg-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Ver todas las instituciones
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
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

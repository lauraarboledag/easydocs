import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import AdminSidebar from "../components/layout/AdminSidebar";
import useInactivity from "../hooks/useInactivity";
import InactivityModal from "../components/InactivityModal";
import NotificationBell from "../components/NotificationBell";
import {
  ArrowLeftRight,
  Bell,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Search,
  Filter,
  AlertCircle,
  X,
  Building2,
} from "lucide-react";

const ACCENT_GRADIENT = "linear-gradient(90deg, #2952cc, #1a2b4a)";

const PLAN_LABELS = {
  free: "Free",
  basic: "Básico",
  professional: "Profesional",
  enterprise: "Empresarial",
};

const REJECT_REASONS = [
  "No recibimos la transferencia.",
  "El monto recibido no coincide con el plan.",
  "El comprobante no es válido o no se puede leer.",
];

const formatPlan = (t) =>
  t.plan_name
    ? `Plan ${PLAN_LABELS[t.plan_name] || t.plan_name}${t.billing_cycle === "annual" ? " · anual" : t.billing_cycle === "monthly" ? " · mensual" : ""}`
    : "Plan desconocido";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", bg: "#fef3c7", color: "#b45309", icon: Clock },
  confirmed: {
    label: "Confirmada",
    bg: "#f0fdf4",
    color: "#16a34a",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rechazada",
    bg: "#fee2e2",
    color: "#dc2626",
    icon: XCircle,
  },
};

export default function AdminTransactions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(null);
  const [success, setSuccess] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [error, setError] = useState(null);
  // Rechazo: transacción elegida y motivo (se le muestra a la institución)
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchTransactions();
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

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/transactions/");
      setTransactions(res.data);
    } catch (err) {
      setError("Error cargando las transacciones. Recarga la página.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (t) => {
    if (
      !confirm(
        `¿Confirmar el pago de ${t.institution_name || "esta institución"} (${formatPlan(t)})? Se activará el plan y se enviará la factura.`,
      )
    )
      return;
    const id = t.id;
    setProcessing(id);
    setError(null);
    try {
      await api.patch(`/transactions/${id}/confirm`, {
        notes: "Confirmado desde panel de administración EasyDocs",
      });
      await fetchTransactions();
      setSuccess("Transacción confirmada exitosamente.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string" && detail
          ? detail
          : "Error confirmando la transacción. Intenta de nuevo.",
      );
      await fetchTransactions();
    } finally {
      setProcessing(null);
    }
  };

  const openReject = (t) => {
    setRejectTarget(t);
    setRejectReason("");
    setError(null);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    setProcessing(id);
    try {
      await api.patch(`/transactions/${id}/reject`, {
        notes: rejectReason.trim() || null,
      });
      setRejectTarget(null);
      await fetchTransactions();
      setSuccess("Transacción rechazada. La institución fue notificada y conserva su plan actual.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string" && detail
          ? detail
          : "Error rechazando la transacción. Intenta de nuevo.",
      );
      setRejectTarget(null);
      await fetchTransactions();
    } finally {
      setProcessing(null);
    }
  };

  const pending = transactions.filter((t) => t.status === "pending");
  const confirmed = transactions.filter((t) => t.status === "confirmed");
  const rejected = transactions.filter((t) => t.status === "rejected");

  const filtered = transactions.filter((t) => {
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.subscription_id.toLowerCase().includes(q) ||
      (t.institution_name || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div
      className="min-h-screen flex overflow-x-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <AdminSidebar onLogout={() => setShowLogout(true)} />

      <main className="md:ml-56 flex-1 flex flex-col min-w-0">
        <header
          className="border-b pl-16 pr-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
            boxShadow: "0 1px 0 rgba(26,43,74,0.04)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1
                className="text-lg font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                Transacciones
              </h1>
              <p className="text-xs hidden sm:block" style={{ color: "var(--text-secondary)" }}>
                Gestión de pagos y suscripciones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ boxShadow: "0 2px 8px rgba(234,179,8,0.4)" }}
              >
                <Shield size={14} className="text-white" />
              </div>
              <p
                className="text-sm font-medium hidden sm:block"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8">
          {success && (
            <div
              className="border-l-4 px-4 py-3 rounded-r-xl mb-6 text-sm flex items-center gap-2"
              style={{ backgroundColor: "#f0fdf4", borderColor: "#22c55e", color: "#15803d" }}
            >
              <CheckCircle size={16} className="flex-shrink-0" /> {success}
            </div>
          )}
          {error && (
            <div
              className="border-l-4 px-4 py-3 rounded-r-xl mb-6 text-sm flex items-center gap-2"
              style={{ backgroundColor: "#fef2f2", borderColor: "#dc2626", color: "#b91c1c" }}
            >
              <AlertCircle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Alerta pendientes */}
          {pending.length > 0 && (
            <div
              className="rounded-xl p-4 mb-6 flex items-center gap-3 border-l-4"
              style={{ backgroundColor: "#fefce8", borderColor: "#eab308" }}
            >
              <AlertCircle
                size={18}
                className="text-yellow-600 flex-shrink-0"
              />
              <p className="text-sm text-yellow-700">
                Tienes <strong>{pending.length}</strong> transacción
                {pending.length !== 1 ? "es" : ""} pendiente
                {pending.length !== 1 ? "s" : ""} de confirmación.
              </p>
            </div>
          )}

          {/* Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Pendientes", count: pending.length, key: "pending" },
              {
                label: "Confirmadas",
                count: confirmed.length,
                key: "confirmed",
              },
              { label: "Rechazadas", count: rejected.length, key: "rejected" },
            ].map(({ label, count, key }) => {
              const config = STATUS_CONFIG[key];
              const Icon = config.icon;
              const active = filterStatus === key;
              return (
                <button
                  key={key}
                  onClick={() =>
                    setFilterStatus(filterStatus === key ? "all" : key)
                  }
                  className="rounded-2xl overflow-hidden border text-left transition-all"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: active ? config.color : "var(--border-color)",
                    boxShadow: active
                      ? `0 4px 14px ${config.color}33`
                      : "0 1px 3px rgba(26,43,74,0.06), 0 8px 24px rgba(26,43,74,0.05)",
                  }}
                >
                  <div className="h-1" style={{ backgroundColor: config.color }} />
                  <div className="p-5 flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: config.bg }}
                    >
                      <Icon size={18} style={{ color: config.color }} />
                    </div>
                    <div>
                      <p
                        className="text-2xl font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {count}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {label}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filtros */}
          <div
            className="rounded-2xl border p-4 mb-4 flex flex-col sm:flex-row gap-3"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
              boxShadow: "0 1px 3px rgba(26,43,74,0.06)",
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
                placeholder="Buscar por institución o ID..."
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
              <Filter size={16} style={{ color: "var(--text-secondary)" }} className="flex-shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>
          </div>

          {/* Lista */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
              boxShadow: "0 1px 3px rgba(26,43,74,0.06), 0 8px 24px rgba(26,43,74,0.05)",
            }}
          >
            <div className="h-1" style={{ background: ACCENT_GRADIENT }} />
            {loading ? (
              <div
                className="text-center py-16"
                style={{ color: "var(--text-secondary)" }}
              >
                <ArrowLeftRight size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Cargando transacciones...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle
                  size={32}
                  className="text-green-300 mx-auto mb-3"
                />
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
                  No hay transacciones con ese filtro
                </p>
              </div>
            ) : (
              <>
                {/* Encabezado — solo escritorio */}
                <div
                  className="hidden md:grid grid-cols-12 text-xs uppercase tracking-wide px-6 py-3 border-b"
                  style={{
                    color: "var(--text-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <span className="col-span-4">Institución y plan</span>
                  <span className="col-span-2">Fecha</span>
                  <span className="col-span-2">Monto</span>
                  <span className="col-span-2">Estado</span>
                  <span className="col-span-2">Acción</span>
                </div>
                {filtered.map((t) => {
                  const config = STATUS_CONFIG[t.status];
                  const Icon = config.icon;
                  return (
                    <div key={t.id}>
                      {/* Tarjeta — solo móvil */}
                      <div
                        className="md:hidden px-4 py-4 border-b last:border-0 space-y-3"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className="text-sm font-semibold truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {t.institution_name || "Institución"}
                            </p>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {formatPlan(t)} ·{" "}
                              {new Date(t.created_at).toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <span
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                            style={{
                              backgroundColor: config.bg,
                              color: config.color,
                            }}
                          >
                            <Icon size={11} />
                            {config.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className="text-[10px] uppercase tracking-wide"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Transacción
                            </p>
                            <p
                              className="text-xs font-mono truncate"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {t.id.split("-")[0]}...
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p
                              className="text-[10px] uppercase tracking-wide"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Monto
                            </p>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              ${(t.amount / 100).toLocaleString("es-CO")}{" "}
                              <span className="text-xs font-normal">COP</span>
                            </p>
                          </div>
                        </div>

                        {t.status === "pending" && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => openReject(t)}
                              disabled={processing === t.id}
                              className="text-xs border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1"
                            >
                              <XCircle size={12} /> Rechazar
                            </button>
                            <button
                              onClick={() => handleConfirm(t)}
                              disabled={processing === t.id}
                              className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1"
                            >
                              {processing === t.id ? (
                                "Procesando..."
                              ) : (
                                <>
                                  <CheckCircle size={12} /> Confirmar
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        {t.status !== "pending" && t.notes && (
                          <p
                            className="text-xs italic"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {t.notes}
                          </p>
                        )}
                      </div>

                      {/* Fila — solo escritorio */}
                      <div
                        className="hidden md:grid grid-cols-12 items-center px-6 py-4 border-b last:border-0 transition-colors"
                        style={{ borderColor: "var(--border-color)" }}
                        onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--bg-primary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "transparent")
                        }
                      >
                        <div className="col-span-4 flex items-center gap-3 min-w-0 pr-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: "var(--color-primary-light)" }}
                          >
                            <Building2 size={14} style={{ color: "var(--color-primary)" }} />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "var(--text-primary)" }}
                              title={t.institution_name || ""}
                            >
                              {t.institution_name || "Institución"}
                            </p>
                            <p
                              className="text-xs truncate"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {formatPlan(t)} · <span className="font-mono">{t.id.split("-")[0]}</span>
                            </p>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {new Date(t.created_at).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            ${(t.amount / 100).toLocaleString("es-CO")}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            COP
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: config.bg,
                              color: config.color,
                            }}
                          >
                            <Icon size={11} />
                            {config.label}
                          </span>
                        </div>
                        <div className="col-span-2">
                          {t.status === "pending" && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleConfirm(t)}
                                disabled={processing === t.id}
                                className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                              >
                                {processing === t.id ? (
                                  "..."
                                ) : (
                                  <>
                                    <CheckCircle size={12} /> Confirmar
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => openReject(t)}
                                disabled={processing === t.id}
                                className="p-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                                title="Rechazar pago"
                                aria-label="Rechazar pago"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          )}
                          {t.status !== "pending" && t.notes && (
                            <p
                              className="text-xs italic truncate"
                              style={{ color: "var(--text-secondary)" }}
                              title={t.notes}
                            >
                              {t.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </main>

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl p-5"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100">
                  <XCircle size={18} className="text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    Rechazar pago
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectTarget(null)}
                disabled={processing === rejectTarget.id}
                style={{ color: "var(--text-secondary)" }}
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="rounded-xl p-3 mb-4 text-sm"
              style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
            >
              <p className="font-medium">{rejectTarget.institution_name || "Institución"}</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {formatPlan(rejectTarget)} · ${(rejectTarget.amount / 100).toLocaleString("es-CO")} COP
              </p>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-secondary)" }}>
              Motivo (lo verá la institución)
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {REJECT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRejectReason(r)}
                  className="text-xs px-2.5 py-1 rounded-full border"
                  style={{
                    borderColor: rejectReason === r ? "#dc2626" : "var(--border-color)",
                    color: rejectReason === r ? "#dc2626" : "var(--text-secondary)",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Escribe el motivo o elige uno de arriba (opcional)"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none mb-2"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
              }}
            />
            <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
              La solicitud se cancela y la institución sigue con su plan actual.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                disabled={processing === rejectTarget.id}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg border"
                style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={processing === rejectTarget.id}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: "#dc2626" }}
              >
                {processing === rejectTarget.id ? "Rechazando..." : "Sí, rechazar"}
              </button>
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
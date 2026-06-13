import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import AdminSidebar from "../components/layout/AdminSidebar";
import useInactivity from "../hooks/useInactivity";
import InactivityModal from "../components/InactivityModal";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Building2,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  MessageSquare,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    style: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmada",
    style: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rechazada",
    style: "bg-red-100 text-red-600",
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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/transactions/");
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    setProcessing(id);
    try {
      await api.patch(`/transactions/${id}/confirm`, {
        notes: "Confirmado desde panel de administración EasyDocs",
      });
      await fetchTransactions();
      setSuccess("Transacción confirmada exitosamente.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchSearch =
      t.id.includes(search) || t.subscription_id.includes(search);
    return matchStatus && matchSearch;
  });

  const pending = transactions.filter((t) => t.status === "pending");
  const confirmed = transactions.filter((t) => t.status === "confirmed");
  const rejected = transactions.filter((t) => t.status === "rejected");

  const handleLogout = () => setShowLogout(true);
  const confirmLogout = () => {
    logout();
    navigate("/");
  };

  useInactivity({
    timeout: 30, // 30 minutos
    onWarning: () => setShowInactivity(true),
    onLogout: () => {
      setShowInactivity(false);
      logout();
      navigate("/");
    },
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar onLogout={handleLogout} />
      {/* Contenido */}
      <main className="ml-56 flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Transacciones
              </h1>
              <p className="text-xs text-gray-400">
                Gestión de pagos y suscripciones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
              {pending.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
              <p className="text-sm font-medium text-gray-800">
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          {/* Alerta pendientes */}
          {pending.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
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
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                label: "Pendientes",
                count: pending.length,
                config: STATUS_CONFIG.pending,
              },
              {
                label: "Confirmadas",
                count: confirmed.length,
                config: STATUS_CONFIG.confirmed,
              },
              {
                label: "Rechazadas",
                count: rejected.length,
                config: STATUS_CONFIG.rejected,
              },
            ].map(({ label, count, config }) => {
              const Icon = config.icon;
              return (
                <div
                  key={label}
                  className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.style}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar por ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>
          </div>

          {/* Lista */}
          <div className="bg-white rounded-xl border border-gray-100">
            {loading ? (
              <div className="text-center py-16 text-gray-400">
                <ArrowLeftRight size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Cargando transacciones...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle
                  size={32}
                  className="text-green-300 mx-auto mb-3"
                />
                <p className="text-gray-500 font-medium">Todo al día</p>
                <p className="text-gray-400 text-sm mt-1">
                  No hay transacciones con ese filtro
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-12 text-xs text-gray-400 uppercase tracking-wide px-6 py-3 border-b border-gray-50">
                  <span className="col-span-3">ID Transacción</span>
                  <span className="col-span-3">Suscripción</span>
                  <span className="col-span-2">Monto</span>
                  <span className="col-span-2">Estado</span>
                  <span className="col-span-2">Acción</span>
                </div>
                {filtered.map((t) => {
                  const config = STATUS_CONFIG[t.status];
                  const Icon = config.icon;
                  return (
                    <div
                      key={t.id}
                      className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="col-span-3">
                        <p className="text-xs font-mono text-gray-600">
                          {t.id.split("-")[0]}...
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(t.created_at).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="col-span-3">
                        <p className="text-xs font-mono text-gray-500">
                          {t.subscription_id.split("-")[0]}...
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-semibold text-gray-800">
                          ${(t.amount / 100).toLocaleString("es-CO")}
                        </p>
                        <p className="text-xs text-gray-400">COP</p>
                      </div>
                      <div className="col-span-2">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${config.style}`}
                        >
                          <Icon size={11} />
                          {config.label}
                        </span>
                      </div>
                      <div className="col-span-2">
                        {t.status === "pending" && (
                          <button
                            onClick={() => handleConfirm(t.id)}
                            disabled={processing === t.id}
                            className="text-xs bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                          >
                            {processing === t.id ? (
                              "Procesando..."
                            ) : (
                              <>
                                <CheckCircle size={12} /> Confirmar
                              </>
                            )}
                          </button>
                        )}
                        {t.status === "confirmed" && t.notes && (
                          <p className="text-xs text-gray-400 italic truncate">
                            {t.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </main>

      {showLogout && (
        <LogoutModal
          onConfirm={confirmLogout}
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

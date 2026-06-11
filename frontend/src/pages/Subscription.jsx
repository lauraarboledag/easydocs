import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import Sidebar from "../components/layout/Sidebar";
import {
  CreditCard,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Star,
  Building2,
  ArrowRight,
  Bell,
  AlertCircle,
  X,
} from "lucide-react";

const PLAN_META = {
  free:         { label: "Free",         color: "text-gray-600",   bg: "bg-gray-100",   border: "border-gray-200",   highlight: false, icon: Shield    },
  basic:        { label: "Básico",       color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200",   highlight: false, icon: Zap       },
  professional: { label: "Profesional",  color: "text-purple-600", bg: "bg-purple-50",  border: "border-purple-200", highlight: true,  icon: Star      },
  enterprise:   { label: "Empresarial",  color: "text-yellow-600", bg: "bg-yellow-50",  border: "border-yellow-200", highlight: false, icon: Building2 },
};

const PLAN_FEATURES = {
  free:         ["LR001 – LR009", "1 usuario", "10 documentos / mes"],
  basic:        ["LR001 – LR009", "3 usuarios", "50 documentos / mes"],
  professional: ["LR001 – LR009", "Certificados Capítulo II", "10 usuarios", "200 documentos / mes", "EduBot IA"],
  enterprise:   ["LR001 – LR009", "Certificados Capítulo II", "Usuarios ilimitados", "Documentos ilimitados", "EduBot IA", "Transcripción de audio IA"],
};

const PLAN_ORDER = ["free", "basic", "professional", "enterprise"];

function formatPrice(price) {
  if (price === 0) return "Gratis";
  return `$${(price / 100).toLocaleString("es-CO")} COP`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
}

function daysUntilExpiry(expiresAt) {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
}

// Agrupa planes por nombre, juntando mensual y anual
function groupPlans(plans) {
  const grouped = {};
  for (const plan of plans) {
    if (!grouped[plan.name]) grouped[plan.name] = {};
    grouped[plan.name][plan.billing_cycle] = plan;
  }
  return grouped;
}

export default function Subscription() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [requesting, setRequesting] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, plansRes] = await Promise.all([
          api.get("/subscriptions/my").catch(() => ({ data: null })),
          api.get("/plans/"),
        ]);
        setSubscription(subRes.data);
        setPlans(plansRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => setShowLogout(true);
  const confirmLogout = () => { logout(); navigate("/"); };

  const handleRequestUpgrade = async (plan) => {
    setRequesting(plan.id);
    setSuccessMsg(""); setErrorMsg("");
    try {
      await api.post("/subscriptions/", {
        plan_id: plan.id,
        billing_cycle: plan.billing_cycle,
      });
      setSuccessMsg(
        `Solicitud enviada para el Plan ${PLAN_META[plan.name]?.label || plan.name} (${plan.billing_cycle === "monthly" ? "mensual" : "anual"}). Un administrador la confirmará pronto.`
      );
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "No se pudo enviar la solicitud. Intenta de nuevo.");
    } finally {
      setRequesting(null);
    }
  };

  const currentPlanName = subscription?.plan?.name;
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlanName);
  const daysLeft = daysUntilExpiry(subscription?.expires_at);
  const grouped = groupPlans(plans);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar onLogout={handleLogout} />

      <main className="ml-56 flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-gray-800">Suscripción</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600"><Bell size={20} /></button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2952cc] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user?.full_name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{user?.full_name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-6xl mx-auto w-full">

          {/* Feedback */}
          {successMsg && (
            <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-4 text-sm">
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1">{successMsg}</span>
              <button onClick={() => setSuccessMsg("")}><X size={16} /></button>
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1">{errorMsg}</span>
              <button onClick={() => setErrorMsg("")}><X size={16} /></button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-24 text-gray-400 text-sm">Cargando planes...</div>
          ) : (
            <>
              {/* Banner plan activo */}
              {subscription && currentPlanName ? (
                <div className="mb-8 bg-[#1a2b4a] rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <CreditCard size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-blue-200 text-xs mb-0.5">Plan activo</p>
                      <p className="text-white font-bold text-lg">
                        Plan {PLAN_META[currentPlanName]?.label || currentPlanName}
                      </p>
                      <p className="text-blue-300 text-xs">
                        Vigente hasta {formatDate(subscription.expires_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {daysLeft !== null && (
                      <div className={`text-center px-4 py-2 rounded-xl ${daysLeft <= 7 ? "bg-red-500/20" : "bg-white/10"}`}>
                        <p className={`text-2xl font-bold ${daysLeft <= 7 ? "text-red-300" : "text-white"}`}>{daysLeft}</p>
                        <p className="text-xs text-blue-300">días restantes</p>
                      </div>
                    )}
                    <div className="text-center px-4 py-2 bg-white/10 rounded-xl">
                      <p className="text-2xl font-bold text-white">{formatPrice(subscription.plan?.price)}</p>
                      <p className="text-xs text-blue-300">
                        {subscription.plan?.billing_cycle === "monthly" ? "/ mes" : "/ año"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-8 bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
                  <CreditCard size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">Sin suscripción activa</p>
                  <p className="text-gray-400 text-sm mt-1">Selecciona un plan para comenzar</p>
                </div>
              )}

              {/* Toggle mensual / anual */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentPlanName ? "Planes disponibles" : "Elige tu plan"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentPlanName
                      ? "Mejora tu plan para desbloquear más funcionalidades"
                      : "Empieza gratis o elige el plan que mejor se adapte a tu institución"}
                  </p>
                </div>
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                  >
                    Mensual
                  </button>
                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${billingCycle === "annual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                  >
                    Anual
                    <span className="text-xs bg-green-100 text-green-600 font-semibold px-1.5 py-0.5 rounded-full">−17%</span>
                  </button>
                </div>
              </div>

              {/* Grid de planes */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {PLAN_ORDER.map((planName) => {
                  const planGroup = grouped[planName];
                  if (!planGroup) return null;
                  const plan = planGroup[billingCycle] || planGroup["monthly"];
                  const meta = PLAN_META[planName];
                  const PlanIcon = meta.icon;
                  const isCurrent = planName === currentPlanName;
                  const planIndex = PLAN_ORDER.indexOf(planName);
                  const isDowngrade = planIndex < currentPlanIndex;
                  const isRequesting = requesting === plan?.id;

                  return (
                    <div
                      key={planName}
                      className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col transition-shadow hover:shadow-md ${
                        isCurrent
                          ? "border-[#2952cc] shadow-md"
                          : meta.highlight
                          ? `${meta.border} shadow-sm`
                          : "border-gray-200"
                      }`}
                    >
                      {/* Badge */}
                      {isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-[#2952cc] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                            Tu plan actual
                          </span>
                        </div>
                      )}
                      {!isCurrent && meta.highlight && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                            Más popular
                          </span>
                        </div>
                      )}

                      {/* Header del plan */}
                      <div className="flex items-center gap-3 mb-4 mt-2">
                        <div className={`w-10 h-10 ${meta.bg} rounded-xl flex items-center justify-center`}>
                          <PlanIcon size={20} className={meta.color} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Plan {meta.label}</p>
                          <p className="text-xs text-gray-400">{plan?.description}</p>
                        </div>
                      </div>

                      {/* Precio */}
                      <div className="mb-5">
                        <div className="flex items-end gap-1">
                          <span className="text-3xl font-bold text-gray-900">
                            {plan ? formatPrice(plan.price) : "—"}
                          </span>
                          {plan && plan.price > 0 && (
                            <span className="text-sm text-gray-400 mb-1">
                              {billingCycle === "monthly" ? "/ mes" : "/ año"}
                            </span>
                          )}
                        </div>
                        {billingCycle === "annual" && plan && plan.price > 0 && (
                          <p className="text-xs text-green-600 font-medium mt-1">
                            Equivale a {formatPrice(Math.round(plan.price / 12))} / mes
                          </p>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {(PLAN_FEATURES[planName] || []).map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* Botón */}
                      {isCurrent ? (
                        <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-blue-50 text-[#2952cc] border border-blue-100">
                          Plan actual ✓
                        </div>
                      ) : isDowngrade ? (
                        <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed">
                          Plan inferior
                        </div>
                      ) : (
                        <button
                          onClick={() => plan && handleRequestUpgrade(plan)}
                          disabled={isRequesting || !plan}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                            meta.highlight
                              ? "bg-purple-500 hover:bg-purple-600 text-white"
                              : `${meta.bg} ${meta.color} hover:opacity-80 border ${meta.border}`
                          }`}
                        >
                          {isRequesting ? <Clock size={15} /> : <ArrowRight size={15} />}
                          {isRequesting ? "Enviando..." : planName === "free" ? "Seleccionar" : "Solicitar upgrade"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Nota informativa */}
              <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <strong>¿Cómo funciona el proceso de upgrade?</strong> Al solicitar un plan, un administrador de EduDynamis verificará tu pago y activará el nuevo plan en menos de 24 horas. Próximamente integraremos pagos en línea con Wompi.
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {showLogout && (
        <LogoutModal onConfirm={confirmLogout} onCancel={() => setShowLogout(false)} />
      )}
    </div>
  );
}
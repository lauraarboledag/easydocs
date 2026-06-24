import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import Sidebar from "../components/layout/Sidebar";
import useInactivity from "../hooks/useInactivity";
import InactivityModal from "../components/InactivityModal";
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
  TrendingUp,
} from "lucide-react";

const PLAN_META = {
  free: { label: "Free", icon: Shield, highlight: false },
  basic: { label: "Básico", icon: Zap, highlight: false },
  professional: { label: "Profesional", icon: Star, highlight: true },
  enterprise: { label: "Empresarial", icon: Building2, highlight: false },
};

const PLAN_COLORS = {
  free: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  basic: {
    bg: "var(--color-primary-light)",
    color: "var(--color-primary)",
    border: "var(--color-primary)",
  },
  professional: { bg: "#faf5ff", color: "#9333ea", border: "#9333ea" },
  enterprise: { bg: "#fefce8", color: "#ca8a04", border: "#ca8a04" },
};

const PLAN_FEATURES = {
  free: ["LR001 – LR009", "1 usuario", "10 documentos / mes"],
  basic: ["LR001 – LR009", "3 usuarios", "50 documentos / mes"],
  professional: [
    "LR001 – LR009",
    "Certificados Capítulo II",
    "10 usuarios",
    "200 documentos / mes",
    "EduBot IA",
  ],
  enterprise: [
    "LR001 – LR009",
    "Certificados Capítulo II",
    "Usuarios ilimitados",
    "Documentos ilimitados",
    "EduBot IA",
    "Transcripción de audio IA",
  ],
};

const PLAN_ORDER = ["free", "basic", "professional", "enterprise"];

function formatPrice(price) {
  if (price === 0) return "Gratis";
  return `$${(price / 100).toLocaleString("es-CO")} COP`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function daysUntilExpiry(expiresAt) {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
}

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
  const [showInactivity, setShowInactivity] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);

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

  useInactivity({
    timeout: 30,
    onWarning: () => setShowInactivity(true),
    onLogout: () => {
      setShowInactivity(false);
      logout();
      navigate("/");
    },
  });

  const handleRequestUpgrade = (plan) => {
    if (plan.name === "free") {
      // Plan free — cambio directo sin checkout
      api
        .post("/subscriptions/change-plan", {
          plan_id: plan.id,
          institution_id: user.institution_id,
        })
        .then(async () => {
          setSuccessMsg("Plan Free activado exitosamente.");
          const subRes = await api
            .get("/subscriptions/my")
            .catch(() => ({ data: null }));
          setSubscription(subRes.data);
        })
        .catch((err) => {
          setErrorMsg(
            err.response?.data?.detail || "No se pudo procesar la solicitud.",
          );
        });
    } else {
      // Planes de pago — ir a checkout con el plan y suscripción actual
      navigate("/checkout", {
        state: { plan, currentSubscription: subscription },
      });
    }
  };

  const currentPlanName = subscription?.plan?.name;
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlanName);
  const daysLeft = daysUntilExpiry(subscription?.expires_at);
  const grouped = groupPlans(plans);

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
            Suscripción
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2" style={{ color: "var(--text-secondary)" }}>
              <Bell size={20} />
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

        <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
          {successMsg && (
            <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-4 text-sm">
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1">{successMsg}</span>
              <button onClick={() => setSuccessMsg("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1">{errorMsg}</span>
              <button onClick={() => setErrorMsg("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {loading ? (
            <div
              className="text-center py-24 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Cargando planes...
            </div>
          ) : (
            <>
              {/* Banner plan activo */}
              {subscription && currentPlanName ? (
                <div
                  className="mb-8 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4"
                  style={{
                    background: `linear-gradient(to right, var(--color-banner-from), var(--color-banner-to))`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <CreditCard size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs mb-0.5">
                        Plan activo
                      </p>
                      <p className="text-white font-bold text-lg">
                        Plan{" "}
                        {PLAN_META[currentPlanName]?.label || currentPlanName}
                      </p>
                      <p className="text-white/60 text-xs">
                        Vigente hasta {formatDate(subscription.expires_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {daysLeft !== null && (
                      <div
                        className={`text-center px-4 py-2 rounded-xl ${daysLeft <= 7 ? "bg-red-500/20" : "bg-white/10"}`}
                      >
                        <p
                          className={`text-2xl font-bold ${daysLeft <= 7 ? "text-red-300" : "text-white"}`}
                        >
                          {daysLeft}
                        </p>
                        <p className="text-xs text-white/60">días restantes</p>
                      </div>
                    )}
                    <div className="text-center px-4 py-2 bg-white/10 rounded-xl">
                      <p className="text-2xl font-bold text-white">
                        {formatPrice(subscription.plan?.price)}
                      </p>
                      <p className="text-xs text-white/60">
                        {subscription.plan?.billing_cycle === "monthly"
                          ? "/ mes"
                          : "/ año"}
                      </p>
                    </div>
                    <div className="text-center px-4 py-2 bg-white/10 rounded-xl">
                      <TrendingUp
                        size={20}
                        className="text-white mx-auto mb-1"
                      />
                      <p className="text-xs text-white/60">
                        Plan {PLAN_META[currentPlanName]?.label}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="mb-8 border-2 border-dashed rounded-2xl p-6 text-center"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <CreditCard
                    size={28}
                    className="mx-auto mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Sin suscripción activa
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Selecciona un plan para comenzar
                  </p>
                </div>
              )}

              {/* Toggle */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {currentPlanName ? "Planes disponibles" : "Elige tu plan"}
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {currentPlanName
                      ? "Mejora tu plan para desbloquear más funcionalidades"
                      : "Empieza gratis o elige el plan que mejor se adapte a tu institución"}
                  </p>
                </div>
                <div
                  className="flex items-center rounded-xl p-1"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  {["monthly", "annual"].map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      style={{
                        backgroundColor:
                          billingCycle === cycle
                            ? "var(--bg-secondary)"
                            : "transparent",
                        color:
                          billingCycle === cycle
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                        boxShadow:
                          billingCycle === cycle
                            ? "0 1px 3px rgba(0,0,0,0.1)"
                            : "none",
                      }}
                    >
                      {cycle === "monthly" ? (
                        "Mensual"
                      ) : (
                        <>
                          Anual{" "}
                          <span className="text-xs bg-green-100 text-green-600 font-semibold px-1.5 py-0.5 rounded-full">
                            −17%
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de planes */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {PLAN_ORDER.map((planName) => {
                  const planGroup = grouped[planName];
                  if (!planGroup) return null;
                  const plan = planGroup[billingCycle] || planGroup["monthly"];
                  const meta = PLAN_META[planName];
                  const colors = PLAN_COLORS[planName];
                  const PlanIcon = meta.icon;
                  const isCurrent = planName === currentPlanName;
                  const planIndex = PLAN_ORDER.indexOf(planName);
                  const isDowngrade = planIndex < currentPlanIndex;
                  const isRequesting = requesting === plan?.id;

                  return (
                    <div
                      key={planName}
                      className="relative rounded-2xl border-2 p-6 flex flex-col transition-all hover:shadow-md"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: isCurrent
                          ? "var(--color-primary)"
                          : meta.highlight
                            ? colors.border
                            : "var(--border-color)",
                        boxShadow: isCurrent
                          ? "0 4px 12px rgba(0,0,0,0.1)"
                          : "",
                      }}
                    >
                      {isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span
                            className="text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"
                            style={{ backgroundColor: "var(--color-primary)" }}
                          >
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

                      <div className="flex items-center gap-3 mb-4 mt-2">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: colors.bg }}
                        >
                          <PlanIcon size={20} style={{ color: colors.color }} />
                        </div>
                        <p
                          className="font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Plan {meta.label}
                        </p>
                      </div>

                      <div className="mb-5">
                        <span
                          className="text-3xl font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {plan ? formatPrice(plan.price) : "—"}
                        </span>
                        {plan && plan.price > 0 && (
                          <span
                            className="text-sm ml-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {billingCycle === "monthly" ? "/ mes" : "/ año"}
                          </span>
                        )}
                        {billingCycle === "annual" &&
                          plan &&
                          plan.price > 0 && (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              Equivale a{" "}
                              {formatPrice(Math.round(plan.price / 12))} / mes
                            </p>
                          )}
                      </div>

                      <ul className="space-y-2.5 mb-6 flex-1">
                        {(PLAN_FEATURES[planName] || []).map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <CheckCircle
                              size={14}
                              className="text-green-500 flex-shrink-0 mt-0.5"
                            />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {isCurrent ? (
                        <div
                          className="w-full py-2.5 rounded-xl text-sm font-semibold text-center border"
                          style={{
                            backgroundColor: "var(--color-primary-light)",
                            color: "var(--color-primary)",
                            borderColor: "var(--color-primary)",
                          }}
                        >
                          Plan actual ✓
                        </div>
                      ) : isDowngrade ? (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `¿Deseas cambiar al Plan ${meta.label}? Perderás las funcionalidades de tu plan actual.`,
                              )
                            ) {
                              plan && handleRequestUpgrade(plan);
                            }
                          }}
                          disabled={isRequesting || !plan}
                          className="w-full py-2.5 rounded-xl text-sm font-medium text-center border transition-colors"
                          style={{
                            borderColor: "var(--border-color)",
                            color: "var(--text-secondary)",
                            backgroundColor: "var(--bg-primary)",
                          }}
                        >
                          Cambiar a este plan
                        </button>
                      ) : (
                        <button
                          onClick={() => plan && handleRequestUpgrade(plan)}
                          disabled={isRequesting || !plan}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: meta.highlight
                              ? "#9333ea"
                              : colors.bg,
                            color: meta.highlight ? "#ffffff" : colors.color,
                          }}
                        >
                          {isRequesting ? (
                            <Clock size={15} />
                          ) : (
                            <ArrowRight size={15} />
                          )}
                          {isRequesting
                            ? "Enviando..."
                            : planName === "free"
                              ? "Seleccionar"
                              : "Solicitar upgrade"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Nota */}
              <div
                className="mt-8 rounded-xl px-5 py-4 flex items-start gap-3 border"
                style={{
                  backgroundColor: "var(--color-primary-light)",
                  borderColor: "var(--color-primary)",
                }}
              >
                <AlertCircle
                  size={18}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "var(--color-primary)" }}
                />
                <div
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  <strong>¿Cómo funciona el proceso de upgrade?</strong> Al
                  solicitar un plan, un administrador de EduDynamis verificará
                  tu pago y activará el nuevo plan en menos de 24 horas.
                  Próximamente integraremos pagos en línea con Wompi.
                </div>
              </div>
            </>
          )}
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

      {showCheckout && checkoutPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl w-full max-w-md"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Solicitar Plan {PLAN_META[checkoutPlan.name]?.label}
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {checkoutPlan.billing_cycle === "monthly"
                    ? "Facturación mensual"
                    : "Facturación anual"}
                </p>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--bg-primary)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Plan {PLAN_META[checkoutPlan.name]?.label}
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatPrice(checkoutPlan.price)}
                    <span
                      className="text-xs font-normal ml-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {checkoutPlan.billing_cycle === "monthly"
                        ? "/ mes"
                        : "/ año"}
                    </span>
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {(PLAN_FEATURES[checkoutPlan.name] || []).map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <CheckCircle
                        size={12}
                        className="text-green-500 flex-shrink-0"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "var(--color-primary-light)",
                  border: "1px solid var(--color-primary)",
                }}
              >
                <p
                  className="text-xs font-semibold mb-2"
                  style={{ color: "var(--color-primary)" }}
                >
                  ¿Cómo realizar el pago?
                </p>
                <ol
                  className="space-y-1.5 text-xs list-decimal list-inside"
                  style={{ color: "var(--text-primary)" }}
                >
                  <li>
                    Realiza la transferencia por{" "}
                    {formatPrice(checkoutPlan.price)} COP
                  </li>
                  <li>
                    Envía el comprobante a{" "}
                    <strong>edudynamis1@gmail.com</strong>
                  </li>
                  <li>
                    El equipo de EduDynamis activará tu plan en menos de 24
                    horas
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle
                  size={14}
                  className="text-yellow-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-yellow-700">
                  Próximamente integraremos pagos en línea con{" "}
                  <strong>Wompi</strong> para una experiencia más ágil.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 border font-medium py-3 rounded-lg transition-colors text-sm"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setRequesting(checkoutPlan.id);
                    try {
                      await api.post("/subscriptions/change-plan", {
                        plan_id: checkoutPlan.id,
                        institution_id: user.institution_id,
                      });
                      setShowCheckout(false);
                      setSuccessMsg(
                        `Solicitud enviada para Plan ${PLAN_META[checkoutPlan.name]?.label}. Un administrador la confirmará pronto.`,
                      );
                      const subRes = await api
                        .get("/subscriptions/my")
                        .catch(() => ({ data: null }));
                      setSubscription(subRes.data);
                    } catch (err) {
                      setErrorMsg(
                        err.response?.data?.detail ||
                          "Error al enviar la solicitud.",
                      );
                    } finally {
                      setRequesting(null);
                    }
                  }}
                  disabled={requesting === checkoutPlan.id}
                  className="flex-1 text-white font-semibold py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {requesting === checkoutPlan.id ? (
                    <Clock size={15} />
                  ) : (
                    <ArrowRight size={15} />
                  )}
                  {requesting === checkoutPlan.id
                    ? "Enviando..."
                    : "Confirmar solicitud"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

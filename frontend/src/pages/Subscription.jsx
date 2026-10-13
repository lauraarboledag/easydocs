import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import Sidebar from "../components/layout/Sidebar";
import useInactivity from "../hooks/useInactivity";
import InactivityModal from "../components/InactivityModal";
import PlanCard, { PLAN_GRADIENTS } from "../components/PlanCard";
import { describePlanFeatures } from "../utils/planFeatures";
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
  Hourglass,
  Paperclip,
  Landmark,
  RefreshCw,
  CalendarDays,
} from "lucide-react";

const PLAN_META = {
  free: { label: "Free", icon: Shield, color: "#6b7280", bg: "#f3f4f6" },
  basic: { label: "Básico", icon: Zap, color: "#2952cc", bg: "#eef2ff" },
  professional: { label: "Profesional", icon: Star, color: "#9333ea", bg: "#faf5ff" },
  enterprise: { label: "Empresarial", icon: Building2, color: "#ca8a04", bg: "#fefce8" },
};

const PLAN_ORDER = ["free", "basic", "professional", "enterprise"];

// Comprobante de pago: foto, captura o PDF de hasta 5 MB
const RECEIPT_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_RECEIPT_MB = 5;
const validateReceipt = (file) => {
  if (!file) return "";
  if (!RECEIPT_ACCEPT.split(",").includes(file.type))
    return "Sube una foto (JPG, PNG, WEBP) o un PDF.";
  if (file.size > MAX_RECEIPT_MB * 1024 * 1024)
    return `El comprobante no puede superar ${MAX_RECEIPT_MB} MB.`;
  return "";
};
const uploadReceipt = (file) => {
  const form = new FormData();
  form.append("file", file);
  // Igual que la subida del logo: el api envía JSON por defecto, así que
  // hay que indicar multipart para que el archivo llegue al backend.
  return api.post("/subscriptions/pending/receipt", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

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

const panelStyle = {
  backgroundColor: "var(--bg-secondary)",
  borderColor: "var(--border-color)",
};

export default function Subscription() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [wompiEnabled, setWompiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [requesting, setRequesting] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  // Solicitud de cambio a un plan de pago que espera confirmación del pago
  const [pending, setPending] = useState(null);
  const [cancelingPending, setCancelingPending] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const loadSubscription = async () => {
    const [subRes, pendingRes] = await Promise.all([
      api.get("/subscriptions/my").catch(() => ({ data: null })),
      api.get("/subscriptions/pending").catch(() => ({ data: null })),
    ]);
    setSubscription(subRes.data);
    setPending(pendingRes.data);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [, plansRes, instRes, wompiRes] = await Promise.all([
          loadSubscription(),
          api.get("/plans/"),
          user?.institution_id
            ? api.get(`/institutions/${user.institution_id}`).catch(() => ({ data: null }))
            : Promise.resolve({ data: null }),
          api.get("/payments/wompi/config").catch(() => ({ data: { enabled: false } })),
        ]);
        setPlans(plansRes.data);
        setInstitution(instRes.data);
        setWompiEnabled(!!wompiRes.data?.enabled);
      } catch {
        setErrorMsg("Error al cargar los planes. Intenta de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (subscription?.plan?.billing_cycle) setBillingCycle(subscription.plan.billing_cycle);
  }, [subscription?.plan?.billing_cycle]);

  const handleReceiptSelected = async (file) => {
    const problem = validateReceipt(file);
    if (problem) {
      setErrorMsg(problem);
      return;
    }
    setUploadingReceipt(true);
    try {
      await uploadReceipt(file);
      setSuccessMsg("Comprobante recibido. Lo revisaremos para activar tu plan.");
      await loadSubscription();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === "string" ? detail : "No se pudo subir el comprobante.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleCancelPending = async () => {
    if (!confirm("¿Cancelar la solicitud de cambio de plan? Seguirás con tu plan actual.")) return;
    setCancelingPending(true);
    try {
      await api.delete("/subscriptions/pending");
      setSuccessMsg("Solicitud cancelada. Sigues con tu plan actual.");
      await loadSubscription();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "No se pudo cancelar la solicitud.");
    } finally {
      setCancelingPending(false);
    }
  };

  useInactivity({
    timeout: 30,
    onWarning: () => setShowInactivity(true),
    onLogout: () => {
      setShowInactivity(false);
      logout();
      navigate("/");
    },
  });

  const handleChoosePlan = async (plan) => {
    if (plan.name === "free") {
      // Plan free: cambio directo, sin checkout
      setRequesting(plan.id);
      try {
        await api.post("/subscriptions/change-plan", { plan_id: plan.id });
        setSuccessMsg("Plan Free activado.");
        await loadSubscription();
      } catch (err) {
        setErrorMsg(err.response?.data?.detail || "No se pudo procesar la solicitud.");
      } finally {
        setRequesting(null);
      }
      return;
    }
    // Planes de pago: al checkout con el plan elegido
    navigate("/checkout", { state: { plan, currentSubscription: subscription } });
  };

  // Suscripciones antiguas podían quedar "pendientes" como si fueran el plan
  // actual; en ese caso no se presentan como plan activo.
  const isCurrentActive = subscription?.status === "active";
  const currentPlan = subscription?.plan;
  const currentPlanName = currentPlan?.name;
  const currentMeta = PLAN_META[currentPlanName];
  const pendingPlanName = pending?.plan?.name;
  const pendingIsWompi = pending?.payment_method === "wompi";
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlanName);
  const daysLeft = daysUntilExpiry(subscription?.expires_at);
  const totalDays = currentPlan?.billing_cycle === "annual" ? 365 : 30;
  const percentLeft =
    daysLeft === null ? null : Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100)));
  const expiringSoon = daysLeft !== null && daysLeft <= 7;
  const grouped = groupPlans(plans);

  return (
    <div
      className="min-h-screen flex overflow-x-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="md:ml-56 flex-1 flex flex-col min-w-0">
        <header
          className="border-b pl-16 pr-4 md:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-10"
          style={panelStyle}
        >
          <div>
            <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Suscripción
            </h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Tu plan y los planes disponibles
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
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
              <p
                className="hidden md:block text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
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
            <div className="text-center py-24 text-sm" style={{ color: "var(--text-secondary)" }}>
              Cargando planes...
            </div>
          ) : (
            <>
              {/* ---- Tu plan ---- */}
              {currentPlan ? (
                <section
                  className="mb-6 rounded-2xl border p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[minmax(0,22rem)_1fr] gap-6 items-center"
                  style={panelStyle}
                >
                  <div className="flex justify-center">
                    <PlanCard
                      plan={currentPlan}
                      cycle={currentPlan.billing_cycle}
                      institutionName={institution?.name}
                      caption={isCurrentActive ? "Plan activo" : "Pendiente de activación"}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                        Plan {currentMeta?.label || currentPlanName}
                      </h2>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isCurrentActive
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                          }`}
                      >
                        {isCurrentActive ? "Activo" : "Pendiente"}
                      </span>
                    </div>
                    <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                      {currentPlan.price > 0
                        ? `${formatPrice(currentPlan.price)} ${currentPlan.billing_cycle === "annual" ? "al año" : "al mes"
                        }`
                        : "Plan gratuito, sin fecha de vencimiento"}
                    </p>

                    {isCurrentActive && daysLeft !== null && (
                      <div className="mb-5">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span
                            className="flex items-center gap-1.5 font-medium"
                            style={{ color: expiringSoon ? "#dc2626" : "var(--text-primary)" }}
                          >
                            <CalendarDays size={13} />
                            {daysLeft > 0
                              ? `Quedan ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`
                              : "Tu plan venció"}
                          </span>
                          <span style={{ color: "var(--text-secondary)" }}>
                            Vigente hasta {formatDate(subscription.expires_at)}
                          </span>
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: "var(--bg-primary)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentLeft}%`,
                              backgroundColor: expiringSoon ? "#dc2626" : "var(--color-primary)",
                            }}
                          />
                        </div>
                        {expiringSoon && (
                          <p className="text-xs text-red-600 mt-1.5">
                            Renueva antes del vencimiento para no perder acceso a la generación de documentos.
                          </p>
                        )}
                      </div>
                    )}

                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Tu plan incluye
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      {describePlanFeatures(currentPlan.features, currentPlanName).map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-1.5 text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ) : (
                <section
                  className="mb-6 border-2 border-dashed rounded-2xl p-6 text-center"
                  style={panelStyle}
                >
                  <CreditCard size={28} className="mx-auto mb-2" style={{ color: "var(--text-secondary)" }} />
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                    Sin suscripción activa
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Elige un plan para comenzar
                  </p>
                </section>
              )}

              {/* ---- Solicitud pendiente ---- */}
              {pending && pendingPlanName && (
                <section
                  className="mb-8 rounded-2xl border px-4 md:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  style={{ backgroundColor: "#fffbeb", borderColor: "#fcd34d" }}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    {pendingIsWompi ? (
                      <CreditCard size={18} className="text-amber-700" />
                    ) : (
                      <Hourglass size={18} className="text-amber-700" />
                    )}
                  </div>
                  <div className="flex-1 text-sm text-amber-900 min-w-0">
                    <p className="font-semibold">
                      {pendingIsWompi ? "Pago en línea en proceso" : "Solicitud pendiente"}: Plan{" "}
                      {PLAN_META[pendingPlanName]?.label || pendingPlanName} (
                      {pending.plan?.billing_cycle === "annual" ? "anual" : "mensual"},{" "}
                      {formatPrice(pending.plan?.price)})
                    </p>
                    {pendingIsWompi ? (
                      <p className="text-xs mt-1">
                        Si ya pagaste, tu plan se activa en cuanto Wompi confirme el pago. Si cerraste
                        la ventana sin pagar, puedes intentarlo de nuevo.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs mt-1 flex items-center gap-1 font-medium">
                          <Paperclip size={12} />
                          {pending.receipt_uploaded
                            ? "Comprobante adjunto ✓"
                            : "Aún no has adjuntado el comprobante de pago."}
                        </p>
                        <p className="text-xs mt-0.5">
                          Mientras confirmamos tu pago sigues con{" "}
                          {currentPlanName && isCurrentActive
                            ? `tu Plan ${currentMeta?.label || currentPlanName}`
                            : "tu plan actual"}
                          .
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {pendingIsWompi ? (
                      <button
                        onClick={() =>
                          navigate("/checkout", { state: { plan: pending.plan } })
                        }
                        className="text-xs font-semibold px-3 py-2 rounded-lg text-white bg-amber-600 flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Reintentar pago
                      </button>
                    ) : (
                      <label
                        className={`text-xs font-semibold px-3 py-2 rounded-lg text-white bg-amber-600 cursor-pointer flex items-center gap-1 ${uploadingReceipt ? "opacity-50 pointer-events-none" : ""
                          }`}
                      >
                        <Paperclip size={12} />
                        {uploadingReceipt
                          ? "Subiendo..."
                          : pending.receipt_uploaded
                            ? "Cambiar comprobante"
                            : "Adjuntar comprobante"}
                        <input
                          type="file"
                          accept={RECEIPT_ACCEPT}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) handleReceiptSelected(file);
                          }}
                        />
                      </label>
                    )}
                    <button
                      onClick={handleCancelPending}
                      disabled={cancelingPending}
                      className="text-xs font-medium px-3 py-2 rounded-lg border border-amber-400 text-amber-800 disabled:opacity-50"
                    >
                      {cancelingPending ? "Cancelando..." : "Cancelar solicitud"}
                    </button>
                  </div>
                </section>
              )}

              {/* ---- Planes ---- */}
              <div className="flex items-end justify-between mb-5 flex-wrap gap-4 mt-8">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {currentPlanName ? "Planes disponibles" : "Elige tu plan"}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Compara y cambia de plan cuando lo necesites.
                  </p>
                </div>
                <div
                  className="flex items-center rounded-xl p-1 border"
                  style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
                >
                  {["monthly", "annual"].map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      style={{
                        backgroundColor: billingCycle === cycle ? "var(--color-primary)" : "transparent",
                        color: billingCycle === cycle ? "#ffffff" : "var(--text-secondary)",
                      }}
                    >
                      {cycle === "monthly" ? (
                        "Mensual"
                      ) : (
                        <>
                          Anual
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${billingCycle === "annual"
                                ? "bg-white/20 text-white"
                                : "bg-green-100 text-green-700"
                              }`}
                          >
                            −17%
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {PLAN_ORDER.map((planName) => {
                  const planGroup = grouped[planName];
                  if (!planGroup) return null;
                  // El plan Free solo existe en un ciclo
                  const plan = planGroup[billingCycle] || planGroup.monthly || planGroup.annual;
                  if (!plan) return null;
                  const meta = PLAN_META[planName];
                  const PlanIcon = meta.icon;
                  const isCurrent =
                    isCurrentActive &&
                    planName === currentPlanName &&
                    (plan.price === 0 || plan.billing_cycle === currentPlan?.billing_cycle);
                  const isPendingPlan = pending?.plan_id === plan.id;
                  const planIndex = PLAN_ORDER.indexOf(planName);
                  const isDowngrade = currentPlanIndex >= 0 && planIndex < currentPlanIndex;
                  const isRequesting = requesting === plan.id;

                  return (
                    <div
                      key={planName}
                      className="relative rounded-2xl border-2 flex flex-col overflow-hidden transition-shadow hover:shadow-md"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: isCurrent ? "var(--color-primary)" : "var(--border-color)",
                      }}
                    >
                      {/* Franja del color del plan (la misma de su tarjeta) */}
                      <div className="h-1.5" style={{ background: PLAN_GRADIENTS[planName] }} />

                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: meta.bg }}
                          >
                            <PlanIcon size={19} style={{ color: meta.color }} />
                          </div>
                          <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                            {meta.label}
                          </p>
                          {isCurrent && (
                            <span
                              className="ml-auto text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: "var(--color-primary)" }}
                            >
                              Actual
                            </span>
                          )}
                        </div>

                        <div className="mb-5">
                          <p className="whitespace-nowrap">
                            <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                              {plan.price > 0
                                ? `$${(plan.price / 100).toLocaleString("es-CO")}`
                                : "Gratis"}
                            </span>
                            {plan.price > 0 && (
                              <span className="text-xs ml-1" style={{ color: "var(--text-secondary)" }}>
                                COP {plan.billing_cycle === "monthly" ? "/ mes" : "/ año"}
                              </span>
                            )}
                          </p>
                          <p className="text-xs font-medium mt-1 h-4 text-green-600">
                            {plan.price > 0 && plan.billing_cycle === "annual"
                              ? `Equivale a ${formatPrice(Math.round(plan.price / 12))} / mes`
                              : ""}
                          </p>
                        </div>

                        <ul className="space-y-2 mb-6 flex-1">
                          {describePlanFeatures(plan.features, planName).map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-2 text-sm"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        {isPendingPlan ? (
                          <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center border flex items-center justify-center gap-2 bg-amber-50 border-amber-300 text-amber-700">
                            <Hourglass size={14} /> Solicitud pendiente
                          </div>
                        ) : isCurrent ? (
                          <div
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
                            style={{
                              backgroundColor: "var(--color-primary-light)",
                              color: "var(--color-primary)",
                            }}
                          >
                            Tu plan actual
                          </div>
                        ) : isDowngrade ? (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `¿Deseas cambiar al Plan ${meta.label}? Perderás las funciones de tu plan actual.`,
                                )
                              ) {
                                handleChoosePlan(plan);
                              }
                            }}
                            disabled={isRequesting}
                            className="w-full py-2.5 rounded-xl text-sm font-medium text-center border transition-colors disabled:opacity-50"
                            style={{
                              borderColor: "var(--border-color)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {isRequesting ? "Cambiando..." : `Cambiar a ${meta.label}`}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleChoosePlan(plan)}
                            disabled={isRequesting}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: "var(--color-primary)" }}
                          >
                            {isRequesting ? <Clock size={15} /> : <ArrowRight size={15} />}
                            {isRequesting
                              ? "Cambiando..."
                              : planName === "free"
                                ? "Empezar gratis"
                                : currentPlanName === planName
                                  ? `Cambiar a ${billingCycle === "annual" ? "anual" : "mensual"}`
                                  : `Mejorar a ${meta.label}`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ---- Cómo se paga ---- */}
              <section className="mt-8 rounded-2xl border p-5" style={panelStyle}>
                <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  ¿Cómo se paga un plan?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--color-primary-light)" }}
                    >
                      <CreditCard size={16} style={{ color: "var(--color-primary)" }} />
                    </div>
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      <p className="font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        Pago en línea
                        {!wompiEnabled && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Próximamente
                          </span>
                        )}
                      </p>
                      Tarjeta, PSE, Nequi o Botón Bancolombia a través de Wompi. Tu plan se activa
                      apenas se aprueba el pago.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--color-primary-light)" }}
                    >
                      <Landmark size={16} style={{ color: "var(--color-primary)" }} />
                    </div>
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                        Transferencia bancaria
                      </p>
                      Adjunta el comprobante y el equipo de EduDynamis activa tu plan en menos de 24
                      horas hábiles.
                    </div>
                  </div>
                </div>
              </section>
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
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import {
  ChevronLeft,
  CheckCircle,
  Bell,
  Shield,
  Zap,
  Star,
  Building2,
  ArrowRight,
  Clock,
  AlertCircle,
  CreditCard,
  Mail,
  Copy,
  Check,
} from "lucide-react";

const PLAN_META = {
  free: { label: "Free", icon: Shield, color: "#6b7280", bg: "#f3f4f6" },
  basic: {
    label: "Básico",
    icon: Zap,
    color: "var(--color-primary)",
    bg: "var(--color-primary-light)",
  },
  professional: {
    label: "Profesional",
    icon: Star,
    color: "#9333ea",
    bg: "#faf5ff",
  },
  enterprise: {
    label: "Empresarial",
    icon: Building2,
    color: "#ca8a04",
    bg: "#fefce8",
  },
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

function formatPrice(price) {
  if (price === 0) return "Gratis";
  return `$${(price / 100).toLocaleString("es-CO")} COP`;
}

function PlanCard({ planName, plan, label, isCurrent }) {
  const meta = PLAN_META[planName] || PLAN_META.free;
  const Icon = meta.icon;
  return (
    <div
      className="rounded-2xl border-2 p-5 flex flex-col gap-3"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: isCurrent ? "var(--border-color)" : meta.color,
        opacity: isCurrent ? 0.7 : 1,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: meta.bg }}
          >
            <Icon size={18} style={{ color: meta.color }} />
          </div>
          <p
            className="font-bold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Plan {meta.label}
          </p>
        </div>
        {isCurrent && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-secondary)",
            }}
          >
            Actual
          </span>
        )}
        {!isCurrent && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
            style={{ backgroundColor: meta.color }}
          >
            Nuevo
          </span>
        )}
      </div>
      <div>
        <span
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {plan ? formatPrice(plan.price) : "—"}
        </span>
        {plan && plan.price > 0 && (
          <span
            className="text-xs ml-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {plan.billing_cycle === "monthly" ? "/ mes" : "/ año"}
          </span>
        )}
      </div>
      <ul className="space-y-1.5">
        {(PLAN_FEATURES[planName] || []).map((f) => (
          <li
            key={f}
            className="flex items-center gap-2 text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Checkout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Datos que vienen desde Subscription.jsx via navigate state
  const { plan: checkoutPlan, currentSubscription } = location.state || {};

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
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

  // Si no hay plan, redirigir a suscripción
  useEffect(() => {
    if (!checkoutPlan) navigate("/suscripcion");
  }, [checkoutPlan]);

  if (!checkoutPlan) return null;

  const planName = checkoutPlan.name;
  const meta = PLAN_META[planName] || PLAN_META.free;
  const currentPlanName = currentSubscription?.plan?.name;
  const isAnnual = checkoutPlan.billing_cycle === "annual";
  const monthlyEquivalent = isAnnual
    ? Math.round(checkoutPlan.price / 12)
    : null;
  const savings = isAnnual
    ? Math.round((checkoutPlan.price * 12) / 10 - checkoutPlan.price)
    : null;

  const handleCopy = () => {
    navigator.clipboard.writeText("edudynamis1@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    setSending(true);
    setError("");
    try {
      await api.post("/subscriptions/change-plan", {
        plan_id: checkoutPlan.id,
        institution_id: user.institution_id,
      });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al enviar la solicitud.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div
        className="min-h-screen flex"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <Sidebar onLogout={() => setShowLogout(true)} />
        <main className="ml-56 flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              ¡Solicitud enviada!
            </h1>
            <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
              Tu solicitud para el <strong>Plan {meta.label}</strong> fue
              registrada exitosamente.
            </p>
            <p
              className="text-sm mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              Envía el comprobante de pago a{" "}
              <strong>edudynamis1@gmail.com</strong> y el equipo de EduDynamis
              activará tu plan en menos de 24 horas.
            </p>

            <div
              className="rounded-xl p-5 mb-6 text-left space-y-3 border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-secondary)" }}
              >
                Resumen de tu solicitud
              </p>
              <div className="flex items-center justify-between">
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Plan solicitado
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: meta.color }}
                >
                  Plan {meta.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Monto a pagar
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {formatPrice(checkoutPlan.price)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Facturación
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {isAnnual ? "Anual" : "Mensual"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Estado
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                  Pendiente de confirmación
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/suscripcion")}
                className="flex-1 border font-medium py-3 rounded-lg transition-colors text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                Ver suscripción
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Ir al dashboard
              </button>
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/suscripcion")}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Checkout
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Plan {meta.label} —{" "}
                {isAnnual ? "Facturación anual" : "Facturación mensual"}
              </p>
            </div>
          </div>
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
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
          {/* Título */}
          <div className="mb-8">
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Mejora al Plan {meta.label}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Revisa los detalles y sigue los pasos para completar tu solicitud.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda — Comparación + instrucciones */}
            <div className="lg:col-span-2 space-y-6">
              {/* Comparación de planes */}
              <div
                className="rounded-xl border p-6"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <h3
                  className="font-bold mb-4 text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Comparación de planes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {currentPlanName && (
                    <PlanCard
                      planName={currentPlanName}
                      plan={currentSubscription?.plan}
                      label="Actual"
                      isCurrent={true}
                    />
                  )}
                  <PlanCard
                    planName={planName}
                    plan={checkoutPlan}
                    label="Nuevo"
                    isCurrent={false}
                  />
                </div>
              </div>

              {/* Instrucciones de pago */}
              <div
                className="rounded-xl border p-6"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <h3
                  className="font-bold mb-4 text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  ¿Cómo realizar el pago?
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "Realiza la transferencia",
                      desc: `Transfiere ${formatPrice(checkoutPlan.price)} COP a la cuenta bancaria de EduDynamis: Asesores Educativos. Los datos de cuenta te serán enviados al correo registrado.`,
                      icon: CreditCard,
                    },
                    {
                      step: 2,
                      title: "Envía el comprobante",
                      desc: "Adjunta el comprobante de pago al correo de EduDynamis indicando el nombre de tu institución y el plan solicitado.",
                      icon: Mail,
                    },
                    {
                      step: 3,
                      title: "Activación del plan",
                      desc: "El equipo de EduDynamis verificará tu pago y activará el plan en menos de 24 horas hábiles.",
                      icon: CheckCircle,
                    },
                  ].map(({ step, title, desc, icon: Icon }) => (
                    <div key={step} className="flex gap-4">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        {step}
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold mb-0.5"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {title}
                        </p>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Correo copiable */}
                <div
                  className="mt-5 flex items-center gap-3 p-3 rounded-lg border"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <Mail size={16} style={{ color: "var(--color-primary)" }} />
                  <span
                    className="text-sm flex-1 font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    edudynamis1@gmail.com
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={12} /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Nota Wompi */}
              <div
                className="rounded-xl p-4 flex items-start gap-3 border"
                style={{ backgroundColor: "#fefce8", borderColor: "#fde68a" }}
              >
                <AlertCircle
                  size={16}
                  className="text-yellow-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-yellow-700">
                  Próximamente integraremos pagos en línea con{" "}
                  <strong>Wompi</strong> para una experiencia más ágil y segura.
                  Por ahora el proceso es manual.
                </p>
              </div>
            </div>

            {/* Columna derecha — Resumen y confirmación */}
            <div className="space-y-4">
              <div
                className="rounded-xl border p-5 sticky top-24"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <h3
                  className="font-bold mb-4 text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Resumen del pedido
                </h3>

                <div
                  className="space-y-3 pb-4 border-b"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-secondary)" }}>Plan</span>
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Plan {meta.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Facturación
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {isAnnual ? "Anual" : "Mensual"}
                    </span>
                  </div>
                  {isAnnual && monthlyEquivalent && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>
                        Equivalente
                      </span>
                      <span style={{ color: "var(--text-primary)" }}>
                        {formatPrice(monthlyEquivalent)} / mes
                      </span>
                    </div>
                  )}
                  {isAnnual && savings && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>
                        Ahorro anual
                      </span>
                      <span className="font-medium text-green-600">
                        {formatPrice(savings)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center py-4">
                  <span
                    className="font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Total
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatPrice(checkoutPlan.price)}
                  </span>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-4 flex items-center gap-2">
                    <AlertCircle size={13} /> {error}
                  </div>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={sending}
                  className="w-full text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-40 mb-3"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {sending ? (
                    <>
                      <Clock size={16} /> Enviando...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} /> Confirmar solicitud
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate("/suscripcion")}
                  className="w-full border font-medium py-2.5 rounded-xl text-sm transition-colors"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancelar
                </button>

                <p
                  className="text-xs text-center mt-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Al confirmar, un administrador de EduDynamis procesará tu
                  solicitud manualmente.
                </p>
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

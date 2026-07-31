import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import {
  ChevronLeft,
  CreditCard,
  Building2,
  Bell,
  CheckCircle,
  AlertCircle,
  Landmark,
  Copy,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  FileText,
  Zap,
  Star,
} from "lucide-react";

const PLAN_META = {
  free: { label: "Free", icon: ShieldCheck, color: "#6b7280" },
  basic: { label: "Básico", icon: Zap, color: "#2952cc" },
  professional: { label: "Profesional", icon: Star, color: "#9333ea" },
  enterprise: { label: "Empresarial", icon: Building2, color: "#ca8a04" },
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

function WompiWidget({ plan, institution, onPending }) {
  useEffect(() => {
    if (!window.WidgetCheckout) {
      const script = document.createElement("script");
      script.src = "https://checkout.wompi.co/widget.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePay = () => {
    if (!window.WidgetCheckout) {
      alert(
        "El widget de pago aún está cargando. Intenta de nuevo en un momento.",
      );
      return;
    }

    const reference = `easydocs_${institution.id}_${plan.id}_${Date.now()}`;

    const checkout = new window.WidgetCheckout({
      currency: "COP",
      amountInCents: plan.price,
      reference,
      publicKey: import.meta.env.VITE_WOMPI_PUBLIC_KEY,
      redirectUrl: `${window.location.origin}/suscripcion`,
    });

    checkout.open((result) => {
      const transaction = result.transaction;
      if (
        transaction?.status === "APPROVED" ||
        transaction?.status === "PENDING"
      ) {
        onPending();
      }
    });
  };

  return (
    <button
      onClick={handlePay}
      className="w-full bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
    >
      <CreditCard size={18} /> Pagar con Wompi
    </button>
  );
}

export default function Checkout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [paymentMethod, setPaymentMethod] = useState("wompi");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [copied, setCopied] = useState(false);

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
        const [plansRes, instRes] = await Promise.all([
          api.get("/plans/"),
          api.get(`/institutions/${user.institution_id}`),
        ]);
        setPlans(plansRes.data);
        setInstitution(instRes.data);

        const params = new URLSearchParams(window.location.search);
        const planId = params.get("plan");
        if (planId) {
          const found = plansRes.data.find((p) => p.id === planId);
          if (found) {
            setSelectedPlan(found);
            setBillingCycle(found.billing_cycle);
          }
        }
      } catch {
        setError("Error cargando la información. Recarga la página.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const grouped = {};
  for (const plan of plans) {
    if (!grouped[plan.name]) grouped[plan.name] = {};
    grouped[plan.name][plan.billing_cycle] = plan;
  }

  const planOptions = Object.keys(grouped).filter((name) => name !== "free");

  const handleSelectPlan = (planName) => {
    const plan = grouped[planName]?.[billingCycle];
    if (plan) setSelectedPlan(plan);
    setError("");
  };

  useEffect(() => {
    if (selectedPlan) {
      const planName = selectedPlan.name;
      const newPlan = grouped[planName]?.[billingCycle];
      if (newPlan) setSelectedPlan(newPlan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingCycle]);

  const handleTransferRequest = async () => {
    if (!selectedPlan) {
      setError("Selecciona un plan para continuar.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/subscriptions/change-plan", {
        plan_id: selectedPlan.id,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al procesar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWompiPending = () => {
    setSuccess(true);
  };

  const copyReference = () => {
    navigator.clipboard.writeText(`EASYDOCS-${institution?.dane_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <Sidebar onLogout={() => setShowLogout(true)} />
        <main className="ml-56 flex-1 flex items-center justify-center p-8">
          <div
            className="max-w-md w-full rounded-2xl border p-10 text-center"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {paymentMethod === "wompi"
                ? "¡Pago en proceso!"
                : "Solicitud enviada"}
            </h2>
            <p
              className="text-sm mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              {paymentMethod === "wompi"
                ? "Cuando el pago se confirme, tu plan se activará automáticamente y recibirás tu factura por correo."
                : "El equipo de EduDynamis confirmará tu transferencia y activará tu plan en breve."}
            </p>
            <button
              onClick={() => navigate("/suscripcion")}
              className="w-full bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Volver a Suscripción
            </button>
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
                Mejorar plan
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Elige tu plan y método de pago
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

        <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {loading ? (
            <div
              className="text-center py-16 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Cargando...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Selección de plan */}
              <div className="lg:col-span-2 space-y-6">
                <div
                  className="rounded-2xl border p-6"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h2
                      className="font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      1. Elige tu plan
                    </h2>
                    <div
                      className="flex items-center bg-gray-100 rounded-xl p-1"
                      style={{ backgroundColor: "var(--bg-primary)" }}
                    >
                      {["monthly", "annual"].map((cycle) => (
                        <button
                          key={cycle}
                          onClick={() => setBillingCycle(cycle)}
                          className="px-4 py-2 rounded-lg text-xs font-medium transition-colors"
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
                          {cycle === "monthly" ? "Mensual" : "Anual −17%"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {planOptions.map((planName) => {
                      const plan = grouped[planName]?.[billingCycle];
                      if (!plan) return null;
                      const meta = PLAN_META[planName];
                      const Icon = meta.icon;
                      const isSelected = selectedPlan?.id === plan.id;

                      return (
                        <button
                          key={planName}
                          onClick={() => handleSelectPlan(planName)}
                          className="text-left rounded-xl border-2 p-4 transition-all"
                          style={{
                            borderColor: isSelected
                              ? "var(--color-primary)"
                              : "var(--border-color)",
                            backgroundColor: isSelected
                              ? "var(--color-primary-light)"
                              : "var(--bg-primary)",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon size={16} style={{ color: meta.color }} />
                            <span
                              className="text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {meta.label}
                            </span>
                            {isSelected && (
                              <CheckCircle
                                size={14}
                                className="ml-auto"
                                style={{ color: "var(--color-primary)" }}
                              />
                            )}
                          </div>
                          <p
                            className="text-lg font-bold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {formatPrice(plan.price)}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {billingCycle === "monthly" ? "/ mes" : "/ año"}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {selectedPlan && (
                    <div
                      className="mt-5 pt-5 border-t"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <p
                        className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Incluye
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(PLAN_FEATURES[selectedPlan.name] || []).map((f) => (
                          <div
                            key={f}
                            className="flex items-center gap-1.5 text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <CheckCircle
                              size={11}
                              className="text-green-500 flex-shrink-0"
                            />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Método de pago */}
                <div
                  className="rounded-2xl border p-6"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <h2
                    className="font-bold mb-5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    2. Método de pago
                  </h2>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setPaymentMethod("wompi")}
                      className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left"
                      style={{
                        borderColor:
                          paymentMethod === "wompi"
                            ? "var(--color-primary)"
                            : "var(--border-color)",
                        backgroundColor:
                          paymentMethod === "wompi"
                            ? "var(--color-primary-light)"
                            : "var(--bg-primary)",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: "var(--color-primary-light)",
                        }}
                      >
                        <CreditCard
                          size={16}
                          style={{ color: "var(--color-primary)" }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Pago en línea
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Tarjeta, PSE, Nequi
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("transfer")}
                      className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left"
                      style={{
                        borderColor:
                          paymentMethod === "transfer"
                            ? "var(--color-primary)"
                            : "var(--border-color)",
                        backgroundColor:
                          paymentMethod === "transfer"
                            ? "var(--color-primary-light)"
                            : "var(--bg-primary)",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: "var(--color-primary-light)",
                        }}
                      >
                        <Landmark
                          size={16}
                          style={{ color: "var(--color-primary)" }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Transferencia
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Confirmación manual
                        </p>
                      </div>
                    </button>
                  </div>

                  {paymentMethod === "transfer" && (
                    <div
                      className="rounded-xl p-5 space-y-3"
                      style={{ backgroundColor: "var(--bg-primary)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Banco
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Bancolombia
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Cuenta de ahorros
                        </span>
                        <span
                          className="text-sm font-medium font-mono"
                          style={{ color: "var(--text-primary)" }}
                        >
                          000-000000-00
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          A nombre de
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          EduDynamis SAS
                        </span>
                      </div>
                      <div
                        className="flex items-center justify-between pt-3 border-t"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Referencia de pago
                        </span>
                        <button
                          onClick={copyReference}
                          className="flex items-center gap-1.5 text-sm font-mono font-medium"
                          style={{ color: "var(--color-primary)" }}
                        >
                          EASYDOCS-{institution?.dane_code}
                          {copied ? (
                            <CheckCircle size={13} />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen */}
              <div className="space-y-4">
                <div
                  className="rounded-2xl border p-6 sticky top-24"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <Sparkles
                      size={16}
                      style={{ color: "var(--color-primary)" }}
                    />
                    <h3
                      className="font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Resumen
                    </h3>
                  </div>

                  {selectedPlan ? (
                    <>
                      <div
                        className="flex items-center gap-3 mb-4 pb-4 border-b"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--color-primary-light)",
                          }}
                        >
                          <FileText
                            size={18}
                            style={{ color: "var(--color-primary)" }}
                          />
                        </div>
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Plan {PLAN_META[selectedPlan.name]?.label}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {billingCycle === "monthly"
                              ? "Facturación mensual"
                              : "Facturación anual"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Subtotal
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {formatPrice(selectedPlan.price)}
                        </span>
                      </div>
                      <div
                        className="flex items-center justify-between mb-4 pb-4 border-b"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          IVA
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Incluido
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-6">
                        <span
                          className="text-sm font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Total
                        </span>
                        <span
                          className="text-xl font-bold"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {formatPrice(selectedPlan.price)}
                        </span>
                      </div>

                      {paymentMethod === "wompi" ? (
                        <WompiWidget
                          plan={selectedPlan}
                          institution={institution}
                          onPending={handleWompiPending}
                        />
                      ) : (
                        <button
                          onClick={handleTransferRequest}
                          disabled={submitting}
                          className="w-full bg-[#2952cc] hover:bg-[#1e3fa8] disabled:opacity-40 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          {submitting ? (
                            "Enviando..."
                          ) : (
                            <>
                              Confirmar solicitud <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard
                        size={28}
                        className="mx-auto mb-3 opacity-30"
                        style={{ color: "var(--text-secondary)" }}
                      />
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Selecciona un plan para continuar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

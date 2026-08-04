import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import {
  Shield,
  Zap,
  Star,
  Building2,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  MapPin,
  User,
  Lock,
  CreditCard,
  FileText,
  Sparkles,
} from "lucide-react";

const DEPARTAMENTOS = [
  "Antioquia",
  "Atlántico",
  "Bogotá D.C.",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Cauca",
  "Cesar",
  "Córdoba",
  "Cundinamarca",
  "Chocó",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Quindío",
  "Risaralda",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
];

const NIVELES_EDUCATIVOS = [
  "Educación para el Trabajo y el Desarrollo Humano",
  "Educación Informal",
  "Educación Básica y Media",
];

const PLAN_META = {
  free: {
    label: "Free",
    color: "text-gray-600",
    bg: "bg-gray-100",
    border: "border-gray-200",
    icon: Shield,
    highlight: false,
  },
  basic: {
    label: "Básico",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Zap,
    highlight: false,
  },
  professional: {
    label: "Profesional",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: Star,
    highlight: true,
  },
  enterprise: {
    label: "Empresarial",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: Building2,
    highlight: false,
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

const PLAN_ORDER = ["free", "basic", "professional", "enterprise"];
const STEP_LABELS = ["Institución", "Representante", "Seguridad", "Plan"];
const STEP_ICONS = [Building2, User, Lock, CreditCard];

function formatPrice(price) {
  if (price === 0) return "Gratis";
  return `$${(price / 100).toLocaleString("es-CO")} COP`;
}

function GoogleButton({ onCredential }) {
  const btnRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!loaded || !window.google?.accounts?.id || !btnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => onCredential(response.credential),
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      width: 400,
      text: "continue_with",
      shape: "rectangular",
    });
  }, [loaded, onCredential]);

  return <div ref={btnRef} className="flex justify-center overflow-x-auto" />;
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlanName, setSelectedPlanName] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [googleVerifying, setGoogleVerifying] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);

  const [institution, setInstitution] = useState({
    name: "",
    dane_code: "",
    department: "",
    municipality: "",
    address: "",
    phone: "",
    email: "",
    education_level: "",
    license_number: "",
  });

  const [representative, setRepresentative] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    api
      .get("/plans/")
      .then((res) => setPlans(res.data))
      .catch(() => {});
  }, []);

  const handleInstitution = (e) => {
    setInstitution({ ...institution, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRepresentative = (e) => {
    const { name, value } = e.target;
    setRepresentative({ ...representative, [name]: value });
    setError("");
    if (name === "password") {
      setPasswordStrength({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*]/.test(value),
      });
    }
  };

  const handleGoogleCredential = async (credential) => {
    setGoogleVerifying(true);
    setError("");
    try {
      const res = await api.post("/auth/google/verify", { credential });
      if (res.data.already_exists) {
        setError(
          "Ya existe una cuenta registrada con este correo. Inicia sesión en su lugar.",
        );
        return;
      }
      setRepresentative((prev) => ({
        ...prev,
        full_name: res.data.full_name || prev.full_name,
        email: res.data.email,
      }));
      setGoogleLinked(true);
    } catch {
      setError("No se pudo verificar tu cuenta de Google. Intenta de nuevo.");
    } finally {
      setGoogleVerifying(false);
    }
  };

  const validateStep1 = () => {
    const required = [
      "name",
      "dane_code",
      "department",
      "municipality",
      "education_level",
    ];
    for (const field of required) {
      if (!institution[field]) {
        setError("Por favor completa todos los campos obligatorios.");
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    if (!representative.full_name || !representative.email) {
      setError("Por favor completa todos los campos.");
      return false;
    }
    if (!representative.email.includes("@")) {
      setError("Ingresa un correo válido.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!representative.password) {
      setError("Ingresa una contraseña.");
      return false;
    }
    if (representative.password !== representative.confirm_password) {
      setError("Las contraseñas no coinciden.");
      return false;
    }
    if (!Object.values(passwordStrength).every(Boolean)) {
      setError("La contraseña no cumple con todos los requisitos.");
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!selectedPlanId) {
      setError("Selecciona un plan para continuar.");
      return false;
    }
    if (!acceptedTerms) {
      setError("Debes aceptar los Términos y Condiciones para continuar.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError("");
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlanId(plan.id);
    setSelectedPlanName(plan.name);
    setError("");
  };

  const handleSubmit = async () => {
    if (!validateStep4()) return;
    setLoading(true);
    try {
      const registerRes = await api.post("/auth/register", {
        institution: {
          name: institution.name,
          dane_code: institution.dane_code,
          department: institution.department,
          municipality: institution.municipality,
          address: institution.address || null,
          phone: institution.phone || null,
          email: institution.email || null,
          education_level: institution.education_level,
          license_number: institution.license_number || null,
        },
        representative_name: representative.full_name,
        representative_email: representative.email,
        representative_password: representative.password,
      });

      const token = registerRes.data.access_token;
      const institutionId = registerRes.data.user.institution_id;

      await api.post(
        "/subscriptions/",
        { plan_id: selectedPlanId, institution_id: institutionId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setStep(5);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Error al registrar. Intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const grouped = {};
  for (const plan of plans) {
    if (!grouped[plan.name]) grouped[plan.name] = {};
    grouped[plan.name][plan.billing_cycle] = plan;
  }

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;
  const strengthColors = [
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-500",
  ];
  const strengthLabels = ["Muy débil", "Débil", "Regular", "Fuerte"];

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#f7f8fb" }}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 sm:gap-3"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1a2b4a] flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-white" />
          </div>
          <span className="text-base sm:text-lg font-bold text-[#1a2b4a] hidden sm:block">
            EasyDocs
          </span>
        </button>
        {step < 5 && (
          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 sm:px-3 py-1.5 rounded-full whitespace-nowrap">
            Paso {step} de 4
          </span>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Stepper */}
        {step < 5 && (
          <div className="flex items-center justify-center mb-8 sm:mb-12 overflow-x-auto">
            {STEP_LABELS.map((label, i) => {
              const StepIcon = STEP_ICONS[i];
              return (
                <div key={i} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all"
                      style={{
                        backgroundColor:
                          step > i + 1
                            ? "#16a34a"
                            : step === i + 1
                              ? "#2952cc"
                              : "#f3f4f6",
                        boxShadow:
                          step === i + 1
                            ? "0 4px 12px rgba(41,82,204,0.25)"
                            : "none",
                      }}
                    >
                      {step > i + 1 ? (
                        <CheckCircle size={16} className="text-white" />
                      ) : (
                        <StepIcon
                          size={16}
                          className={
                            step === i + 1 ? "text-white" : "text-gray-400"
                          }
                        />
                      )}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 font-medium whitespace-nowrap ${step === i + 1 ? "text-[#2952cc]" : "text-gray-400"}`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div
                      className="w-8 sm:w-12 lg:w-20 h-0.5 mx-1.5 sm:mx-2 mb-5 transition-colors"
                      style={{
                        backgroundColor: step > i + 1 ? "#16a34a" : "#e5e7eb",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <Shield size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Paso 1 — Datos institucionales */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-gray-50 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#eef2ff] flex items-center justify-center flex-shrink-0">
                <Building2 size={20} className="text-[#2952cc]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Información Institucional
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                  Identificación y ubicación de tu institución
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Nombre de la institución *
                  </label>
                  <input
                    name="name"
                    value={institution.name}
                    onChange={handleInstitution}
                    placeholder="Ej: Instituto Técnico del Futuro"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Código DANE *
                  </label>
                  <input
                    name="dane_code"
                    value={institution.dane_code}
                    onChange={handleInstitution}
                    placeholder="12 dígitos numéricos"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Tipo de institución
                  </label>
                  <div className="flex gap-2">
                    {["Pública", "Privada"].map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() =>
                          setInstitution({
                            ...institution,
                            institution_type: tipo,
                          })
                        }
                        className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${
                          institution.institution_type === tipo
                            ? "bg-[#2952cc] text-white border-[#2952cc]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Departamento *
                  </label>
                  <select
                    name="department"
                    value={institution.department}
                    onChange={handleInstitution}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white transition-all"
                  >
                    <option value="">Seleccione...</option>
                    {DEPARTAMENTOS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Municipio *
                  </label>
                  <input
                    name="municipality"
                    value={institution.municipality}
                    onChange={handleInstitution}
                    placeholder="Ej: Medellín"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Nivel educativo *
                  </label>
                  <select
                    name="education_level"
                    value={institution.education_level}
                    onChange={handleInstitution}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white transition-all"
                  >
                    <option value="">Seleccione...</option>
                    {NIVELES_EDUCATIVOS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Resolución de funcionamiento
                  </label>
                  <input
                    name="license_number"
                    value={institution.license_number}
                    onChange={handleInstitution}
                    placeholder="Número de resolución y fecha"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Teléfono de contacto
                  </label>
                  <input
                    name="phone"
                    value={institution.phone}
                    onChange={handleInstitution}
                    placeholder="+57 300 000 0000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Dirección física
                  </label>
                  <input
                    name="address"
                    value={institution.address}
                    onChange={handleInstitution}
                    placeholder="Ej: Calle 45 # 12-34"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="bg-[#eef2ff] border border-[#dbe4ff] rounded-xl p-4 mt-6 flex gap-3">
                <MapPin
                  size={18}
                  className="text-[#2952cc] flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-[#2952cc]">
                  Los datos proporcionados alimentarán el{" "}
                  <strong>directorio nacional de EasyDocs</strong>, facilitando
                  la transparencia administrativa para instituciones ETDH.
                </p>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Guardar y continuar <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2 — Representante */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-gray-50 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#eef2ff] flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-[#2952cc]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Datos del Representante
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                  Información oficial del representante legal
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              {/* Google */}
              <div className="mb-6">
                {googleLinked ? (
                  <div className="flex items-start sm:items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    <CheckCircle
                      size={18}
                      className="text-green-600 flex-shrink-0"
                    />
                    <p className="text-sm text-green-700">
                      Datos verificados con Google. Completa tu contraseña en el
                      siguiente paso.
                    </p>
                  </div>
                ) : (
                  <>
                    <GoogleButton onCredential={handleGoogleCredential} />
                    {googleVerifying && (
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Verificando con Google...
                      </p>
                    )}
                    <div className="flex items-center gap-3 my-6">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-400 text-center">
                        o completa manualmente
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Nombre completo *
                  </label>
                  <input
                    name="full_name"
                    value={representative.full_name}
                    onChange={handleRepresentative}
                    placeholder="Ej: Juan Antonio Pérez Rodríguez"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Correo institucional *
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={representative.email}
                    onChange={handleRepresentative}
                    disabled={googleLinked}
                    placeholder="representante@institucion.edu.co"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <input
                  type="checkbox"
                  id="certifico"
                  className="mt-0.5 accent-[#2952cc] flex-shrink-0"
                />
                <label htmlFor="certifico" className="text-xs text-gray-600">
                  Certifico bajo la gravedad de juramento que poseo la
                  representación legal vigente de la institución y que toda la
                  información suministrada es verídica.
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <ChevronLeft size={16} /> Regresar
                </button>
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paso 3 — Contraseña */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-gray-50 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#eef2ff] flex items-center justify-center flex-shrink-0">
                <Lock size={20} className="text-[#2952cc]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Crea tu contraseña
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                  Protege el acceso administrativo de tu institución
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Nueva contraseña
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={representative.password}
                    onChange={handleRepresentative}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent transition-all"
                  />

                  {representative.password && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Fortaleza:</span>
                        <span
                          className={`font-medium ${strengthScore < 2 ? "text-red-500" : strengthScore < 4 ? "text-yellow-500" : "text-green-500"}`}
                        >
                          {strengthLabels[strengthScore - 1] || "Muy débil"}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${i < strengthScore ? strengthColors[strengthScore - 1] : "bg-gray-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {[
                      { key: "length", label: "Mínimo 8 caracteres" },
                      { key: "uppercase", label: "Al menos una mayúscula" },
                      { key: "number", label: "Incluye números (0-9)" },
                      { key: "special", label: "Carácter especial (!@#$%^&*)" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${passwordStrength[key] ? "bg-green-500 border-green-500" : "border-gray-300"}`}
                        >
                          {passwordStrength[key] && (
                            <CheckCircle size={10} className="text-white" />
                          )}
                        </div>
                        <span
                          className={`text-xs ${passwordStrength[key] ? "text-green-600" : "text-gray-500"}`}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Confirmar contraseña
                  </label>
                  <input
                    name="confirm_password"
                    type="password"
                    value={representative.confirm_password}
                    onChange={handleRepresentative}
                    placeholder="Repite tu contraseña"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <ChevronLeft size={16} /> Regresar
                </button>
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paso 4 — Elegir plan */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-gray-50 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#eef2ff] flex items-center justify-center flex-shrink-0">
                <CreditCard size={20} className="text-[#2952cc]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Elige tu plan
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                  Puedes comenzar gratis y cambiar en cualquier momento
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => {
                      setBillingCycle("monthly");
                      setSelectedPlanId(null);
                    }}
                    className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-colors ${billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                  >
                    Mensual
                  </button>
                  <button
                    onClick={() => {
                      setBillingCycle("annual");
                      setSelectedPlanId(null);
                    }}
                    className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${billingCycle === "annual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                  >
                    Anual
                    <span className="text-xs bg-green-100 text-green-600 font-semibold px-1.5 py-0.5 rounded-full">
                      −17%
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {PLAN_ORDER.map((planName) => {
                  const planGroup = grouped[planName];
                  if (!planGroup) return null;
                  const plan = planGroup[billingCycle] || planGroup["monthly"];
                  if (!plan) return null;
                  const meta = PLAN_META[planName];
                  const PlanIcon = meta.icon;
                  const isSelected = selectedPlanId === plan.id;

                  return (
                    <button
                      key={planName}
                      onClick={() => handleSelectPlan(plan)}
                      className={`relative text-left rounded-2xl border-2 p-5 flex flex-col transition-all hover:shadow-md ${isSelected ? "border-[#2952cc] shadow-md bg-blue-50/30" : meta.highlight ? `${meta.border} shadow-sm bg-white` : "border-gray-200 bg-white"}`}
                    >
                      {meta.highlight && !isSelected && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                            Más popular
                          </span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-[#2952cc] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                            <CheckCircle size={11} /> Seleccionado
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3 mt-2">
                        <div
                          className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                        >
                          <PlanIcon size={18} className={meta.color} />
                        </div>
                        <span className="font-bold text-gray-900 text-sm">
                          Plan {meta.label}
                        </span>
                      </div>
                      <div className="mb-3">
                        <span className="text-2xl font-bold text-gray-900">
                          {plan ? formatPrice(plan.price) : "—"}
                        </span>
                        {plan && plan.price > 0 && (
                          <span className="text-xs text-gray-400 ml-1">
                            {billingCycle === "monthly" ? "/ mes" : "/ año"}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1.5 flex-1">
                        {(PLAN_FEATURES[planName] || []).map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-1.5 text-xs text-gray-600"
                          >
                            <CheckCircle
                              size={12}
                              className="text-green-500 flex-shrink-0 mt-0.5"
                            />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div
                        className={`mt-4 w-full py-2 rounded-xl text-xs font-semibold text-center transition-colors ${isSelected ? "bg-[#2952cc] text-white" : `${meta.bg} ${meta.color}`}`}
                      >
                        {isSelected ? "✓ Plan elegido" : "Seleccionar"}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400 text-center mb-6">
                Los planes de pago se activan tras confirmación manual por el
                equipo de EduDynamis. El plan Free se activa automáticamente.
              </p>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 accent-[#2952cc] flex-shrink-0"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 leading-relaxed"
                >
                  He leído y acepto los{" "}
                  <a
                    href="/terminos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2952cc] font-medium hover:underline"
                  >
                    Términos y Condiciones
                  </a>{" "}
                  de EasyDocs y la política de tratamiento de datos personales
                  de EduDynamis: Asesores Educativos.
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <ChevronLeft size={16} /> Regresar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedPlanId || !acceptedTerms}
                  className="w-full sm:w-auto bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    "Registrando..."
                  ) : (
                    <>
                      <ArrowRight size={16} /> Finalizar registro
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paso 5 — Confirmación */}
        {step === 5 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              ¡Bienvenido a bordo!
            </h2>
            <p className="text-gray-500 mb-2 text-sm sm:text-base">
              Tu institución ha sido registrada exitosamente en EasyDocs.
            </p>
            {selectedPlanName && (
              <div className="inline-flex items-center gap-2 bg-blue-50 text-[#2952cc] text-sm font-semibold px-4 py-2 rounded-full mb-6 sm:mb-8">
                <CheckCircle size={15} />
                Plan {PLAN_META[selectedPlanName]?.label ||
                  selectedPlanName}{" "}
                activado
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10 text-left">
              {[
                {
                  icon: "👥",
                  title: "1. Configurar roles",
                  desc: "Define permisos para coordinadores y secretaría académica.",
                },
                {
                  icon: "🎓",
                  title: "2. Agregar usuarios",
                  desc: "Crea cuentas para docentes y personal administrativo.",
                },
                {
                  icon: "📄",
                  title: "3. Generar documento",
                  desc: "Emite tu primer certificado institucional.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-gray-50 rounded-xl p-4">
                  <span className="text-2xl">{icon}</span>
                  <h3 className="font-semibold text-sm text-gray-800 mt-2 mb-1">
                    {title}
                  </h3>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3 px-10 rounded-xl flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              Ir al inicio de sesión <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Aviso normativo */}
        {step < 5 && (
          <div className="flex items-start gap-3 mt-6 px-2">
            <Sparkles
              size={15}
              className="text-gray-400 flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-gray-400">
              Esta plataforma cumple con el Decreto 1075 de 2015 para la gestión
              de instituciones ETDH en territorio colombiano.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

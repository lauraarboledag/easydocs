import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import {
  Shield,
  Zap,
  Star,
  Building2,
  CheckCircle,
  ArrowRight,
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

function formatPrice(price) {
  if (price === 0) return "Gratis";
  return `$${(price / 100).toLocaleString("es-CO")} COP`;
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

  // Cargar planes al montar
  useEffect(() => {
    api
      .get("/plans/")
      .then((res) => setPlans(res.data))
      .catch(console.error);
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
        {
          plan_id: selectedPlanId,
          institution_id: institutionId,
        },
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

  // Agrupa planes por nombre
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

  const STEP_LABELS = ["Institución", "Representante", "Seguridad", "Plan"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <Link to="/">
          <img
            src="/logo_easydocs_azul.png"
            alt="EasyDocs"
            className="h-20 w-auto object-contain"
          />
        </Link>
        {step < 5 && (
          <span className="text-sm text-gray-500">Paso {step} de 4</span>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Stepper */}
        {step < 5 && (
          <div className="flex items-center justify-center mb-10">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      step > i + 1
                        ? "bg-green-500 text-white"
                        : step === i + 1
                          ? "bg-[#2952cc] text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > i + 1 ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 ${step === i + 1 ? "text-[#2952cc] font-medium" : "text-gray-400"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className={`w-16 h-0.5 mx-2 mb-4 ${step > i + 1 ? "bg-green-500" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* ── Paso 1 — Datos institucionales ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Información Institucional
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Paso 1 de 4 — Identificación y ubicación
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Nombre de la institución *
                </label>
                <input
                  name="name"
                  value={institution.name}
                  onChange={handleInstitution}
                  placeholder="Ej: Instituto Técnico del Futuro"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Código DANE *
                </label>
                <input
                  name="dane_code"
                  value={institution.dane_code}
                  onChange={handleInstitution}
                  placeholder="12 dígitos numéricos"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
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
                      className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Departamento *
                </label>
                <select
                  name="department"
                  value={institution.department}
                  onChange={handleInstitution}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Municipio *
                </label>
                <input
                  name="municipality"
                  value={institution.municipality}
                  onChange={handleInstitution}
                  placeholder="Ej: Medellín"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Nivel educativo *
                </label>
                <select
                  name="education_level"
                  value={institution.education_level}
                  onChange={handleInstitution}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Resolución de funcionamiento
                </label>
                <input
                  name="license_number"
                  value={institution.license_number}
                  onChange={handleInstitution}
                  placeholder="Número de resolución y fecha"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Teléfono de contacto
                </label>
                <input
                  name="phone"
                  value={institution.phone}
                  onChange={handleInstitution}
                  placeholder="+57 300 000 0000"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Dirección física
                </label>
                <input
                  name="address"
                  value={institution.address}
                  onChange={handleInstitution}
                  placeholder="Ej: Calle 45 # 12-34"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6 flex gap-3">
              <svg
                className="w-5 h-5 text-[#2952cc] flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-blue-700">
                Los datos proporcionados alimentarán el{" "}
                <strong>directorio nacional de EasyDocs</strong>, facilitando la
                transparencia administrativa para instituciones ETDH.
              </p>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleNext}
                className="bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition-colors"
              >
                Guardar y continuar
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 2 — Representante ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Datos del Representante
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Ingrese la información oficial del representante legal de la
              institución ETDH.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Nombre completo *
                </label>
                <input
                  name="full_name"
                  value={representative.full_name}
                  onChange={handleRepresentative}
                  placeholder="Ej: Juan Antonio Pérez Rodríguez"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Correo institucional *
                </label>
                <input
                  name="email"
                  type="email"
                  value={representative.email}
                  onChange={handleRepresentative}
                  placeholder="representante@institucion.edu.co"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 bg-gray-50 rounded-xl p-4">
              <input
                type="checkbox"
                id="certifico"
                className="mt-0.5 accent-[#2952cc]"
              />
              <label htmlFor="certifico" className="text-xs text-gray-600">
                Certifico bajo la gravedad de juramento que poseo la
                representación legal vigente de la institución y que toda la
                información suministrada es verídica.
              </label>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(1)}
                className="text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                  />
                </svg>
                Regresar
              </button>
              <button
                onClick={handleNext}
                className="bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition-colors"
              >
                Continuar
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 3 — Contraseña ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Crea tu contraseña
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Define una clave segura para proteger el acceso administrativo de
              tu institución.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Nueva contraseña
                </label>
                <input
                  name="password"
                  type="password"
                  value={representative.password}
                  onChange={handleRepresentative}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
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
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${passwordStrength[key] ? "bg-green-500 border-green-500" : "border-gray-300"}`}
                      >
                        {passwordStrength[key] && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Confirmar contraseña
                </label>
                <input
                  name="confirm_password"
                  type="password"
                  value={representative.confirm_password}
                  onChange={handleRepresentative}
                  placeholder="Repite tu contraseña"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(2)}
                className="text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                  />
                </svg>
                Regresar
              </button>
              <button
                onClick={handleNext}
                className="bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition-colors"
              >
                Continuar
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 4 — Elegir plan ── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Elige tu plan
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Puedes comenzar gratis y cambiar en cualquier momento desde tu
              cuenta.
            </p>

            {/* Toggle ciclo */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => {
                    setBillingCycle("monthly");
                    setSelectedPlanId(null);
                  }}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => {
                    setBillingCycle("annual");
                    setSelectedPlanId(null);
                  }}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${billingCycle === "annual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                >
                  Anual
                  <span className="text-xs bg-green-100 text-green-600 font-semibold px-1.5 py-0.5 rounded-full">
                    −17%
                  </span>
                </button>
              </div>
            </div>

            {/* Grid de planes */}
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
                    className={`relative text-left rounded-2xl border-2 p-5 flex flex-col transition-all hover:shadow-md ${
                      isSelected
                        ? "border-[#2952cc] shadow-md bg-blue-50/30"
                        : meta.highlight
                          ? `${meta.border} shadow-sm bg-white`
                          : "border-gray-200 bg-white"
                    }`}
                  >
                    {/* Badges */}
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
                        className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center`}
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

                    {/* Indicador de selección */}
                    <div
                      className={`mt-4 w-full py-2 rounded-xl text-xs font-semibold text-center transition-colors ${
                        isSelected
                          ? "bg-[#2952cc] text-white"
                          : `${meta.bg} ${meta.color}`
                      }`}
                    >
                      {isSelected ? "✓ Plan elegido" : "Seleccionar"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Nota */}
            <p className="text-xs text-gray-400 text-center mb-6">
              Los planes de pago se activan tras confirmación manual por el
              equipo de EduDynamis. El plan Free se activa automáticamente.
            </p>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                  />
                </svg>
                Regresar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedPlanId}
                className="bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition-colors"
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
        )}

        {/* ── Paso 5 — Confirmación ── */}
        {step === 5 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Bienvenido a bordo!
            </h2>
            <p className="text-gray-500 mb-2">
              Tu institución ha sido registrada exitosamente en EasyDocs.
            </p>
            {selectedPlanName && (
              <div className="inline-flex items-center gap-2 bg-blue-50 text-[#2952cc] text-sm font-semibold px-4 py-2 rounded-full mb-8">
                <CheckCircle size={15} />
                Plan {PLAN_META[selectedPlanName]?.label ||
                  selectedPlanName}{" "}
                activado
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-10 text-left">
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
              className="bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3 px-10 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              Ir al inicio de sesión
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Aviso normativo */}
        {step < 5 && (
          <div className="flex items-start gap-3 mt-6 px-2">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
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

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Shield,
  FileText,
  Users,
  CheckCircle,
  ArrowRight,
  Building2,
  Award,
  Clock,
  BarChart3,
  Lock,
  Phone,
} from "lucide-react";

const STATS = [
  { value: "14+", label: "Tipos de documentos", icon: FileText },
  { value: "100%", label: "Cumplimiento Decreto 1075", icon: Shield },
  { value: "40%", label: "Reducción de tiempos", icon: Clock },
  { value: "ETDH", label: "Sector especializado", icon: Building2 },
];

const FEATURES = [
  {
    icon: FileText,
    title: "Documentos reglamentarios",
    desc: "Generación automática de LR001–LR009 y certificados del Capítulo II con validez legal.",
  },
  {
    icon: Users,
    title: "Gestión de matrículas",
    desc: "Control completo de estudiantes, programas y matrículas con importación masiva.",
  },
  {
    icon: Shield,
    title: "Cumplimiento normativo",
    desc: "Actualizado con el Decreto 1075 de 2015 y las directrices de la Secretaría de Educación.",
  },
  {
    icon: BarChart3,
    title: "Panel de métricas",
    desc: "Dashboard con indicadores en tiempo real del estado documental de tu institución.",
  },
  {
    icon: Lock,
    title: "Seguridad bancaria",
    desc: "Cifrado JWT, control de acceso por roles y auditoría de actividad institucional.",
  },
  {
    icon: Award,
    title: "Asistente normativo IA",
    desc: "EduBot resuelve dudas sobre normativa ETDH con base en la Guía de la Secretaría de Medellín.",
  },
];

const PLANS = [
  { name: "Free", price: "Gratis", docs: "10 docs/mes", users: "1 usuario" },
  {
    name: "Básico",
    price: "Desde $89.000",
    docs: "50 docs/mes",
    users: "3 usuarios",
  },
  {
    name: "Profesional",
    price: "Desde $189.000",
    docs: "200 docs/mes",
    users: "10 usuarios",
    popular: true,
  },
  {
    name: "Empresarial",
    price: "349.000",
    docs: "Ilimitado",
    users: "Ilimitado",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src="/logo_easydocs_blanco.png"
            alt="EasyDocs"
            className={`h-10 w-auto object-contain transition-all ${scrolled ? "hidden" : "block"}`}
          />
          <img
            src="/logo_easydocs_azul.png"
            alt="EasyDocs"
            className={`h-10 w-auto object-contain transition-all ${scrolled ? "block" : "hidden"}`}
          />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/landing_video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#0d1b35]/85" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
              <Shield size={14} className="text-blue-300" />
              <span className="text-blue-200 text-xs font-medium">
                Plataforma oficial para instituciones ETDH en Colombia
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Gestión documental para instituciones{" "}
              <span className="text-blue-300">ETDH</span> sin complicaciones
            </h1>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Genera, gestiona y descarga tus documentos reglamentarios del
              Decreto 1075 de 2015 en minutos. Automatiza el trabajo
              administrativo y enfócate en lo que importa: La educación.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              {[
                "Plan gratuito disponible",
                "Soporte en español",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle
                    size={14}
                    className="text-green-400 flex-shrink-0"
                  />
                  <span className="text-blue-200 text-xs">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
            <h3 className="text-white font-bold text-xl mb-6">
              Acceso institucional
            </h3>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => navigate("/registro")}
                className="w-full bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Building2 size={18} /> Registrar institución
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3.5 px-6 rounded-lg border border-white/20 transition-colors"
              >
                Iniciar sesión
              </button>
            </div>
            <div className="border-t border-white/10 pt-6 space-y-3">
              {[
                "LR001 – LR009 incluidos",
                "Certificados Capítulo II",
                "EduBot asistente normativo",
                "Matrículas y programas",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle
                    size={14}
                    className="text-green-400 flex-shrink-0"
                  />
                  <span className="text-blue-100 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#1a2b4a] py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon size={24} className="text-blue-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white mb-1">{value}</p>
              <p className="text-blue-300 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[#2952cc] text-sm font-semibold uppercase tracking-wide">
              Funcionalidades
            </span>
            <h2 className="text-3xl font-bold text-[#1a2b4a] mt-2 mb-4">
              Todo lo que necesita tu institución
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Diseñado específicamente para las necesidades administrativas y
              normativas de las instituciones ETDH en Colombia.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#2952cc]" />
                </div>
                <h3 className="font-bold text-[#1a2b4a] mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[#2952cc] text-sm font-semibold uppercase tracking-wide">
              Planes
            </span>
            <h2 className="text-3xl font-bold text-[#1a2b4a] mt-2 mb-4">
              Elige el plan adecuado para tu institución
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map(({ name, price, docs, users, popular }) => (
              <div
                key={name}
                className={`rounded-xl border-2 p-6 flex flex-col ${
                  popular
                    ? "border-[#2952cc] bg-[#2952cc] text-white"
                    : "border-gray-100 bg-white"
                }`}
              >
                {popular && (
                  <span className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full self-start mb-4">
                    Más popular
                  </span>
                )}
                <h3
                  className={`font-bold text-lg mb-1 ${popular ? "text-white" : "text-[#1a2b4a]"}`}
                >
                  {name}
                </h3>
                <p
                  className={`text-2xl font-bold mb-4 ${popular ? "text-white" : "text-[#2952cc]"}`}
                >
                  {price}
                </p>
                <div
                  className={`space-y-2 mb-6 flex-1 text-sm ${popular ? "text-blue-100" : "text-gray-500"}`}
                >
                  <p>✓ {docs}</p>
                  <p>✓ {users}</p>
                  <p>✓ Documentos LR001–LR009</p>
                </div>
                <button
                  onClick={() => navigate("/registro")}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    popular
                      ? "bg-white text-[#2952cc] hover:bg-blue-50"
                      : "bg-[#2952cc] text-white hover:bg-[#1e3fa8]"
                  }`}
                >
                  Comenzar
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decreto banner */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1a2b4a] flex items-center justify-center flex-shrink-0">
              <Shield size={22} className="text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-[#1a2b4a] text-lg mb-1">
                Decreto 1075 de 2015
              </h3>
              <p className="text-gray-500 text-sm max-w-xl">
                EasyDocs está alineado con todos los requerimientos normativos
                del Decreto 1075 de 2015 para instituciones de Educación para el
                Trabajo y el Desarrollo Humano en Colombia.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/registro")}
            className="flex-shrink-0 bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            Registrar institución <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Contacto */}
      <section className="py-16 bg-[#1a2b4a]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            {"¿Tienes preguntas?"}
          </h2>
          <p className="text-blue-200 mb-6 text-sm">
            {"Nuestro equipo de EduDynamis está disponible para ayudarte."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() =>
                (window.location.href = "mailto:edudynamis1@gmail.com")
              }
              className="flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors"
            >
              <Phone size={14} /> edudynamis1@gmail.com
            </button>
            <span className="hidden sm:block text-blue-700">|</span>
            <button
              onClick={() => window.open("http://www.edudynamis.org", "_blank")}
              className="flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors"
            >
              www.edudynamis.com
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1b35] py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-blue-400 text-xs">
            {
              "© 2026 EasyDocs \u00B7 EduDynamis \u00B7 Todos los derechos reservados"
            }
          </p>
          <button
            onClick={() => navigate("/terminos")}
            className="text-blue-400 hover:text-blue-200 text-xs transition-colors"
          >
            {"Términos y condiciones"}
          </button>
        </div>
      </footer>
    </div>
  );
}

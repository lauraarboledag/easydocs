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
  {
    value: "100%",
    label: "Cumplimiento de Normatividad Educativa y de Archivo",
    icon: Shield,
  },
  { value: "60%", label: "Reducción de tiempos", icon: Clock },
  {
    value: "Establecimientos Educativos",
    label: "Sector especializado",
    icon: Building2,
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: "Documentos reglamentarios",
    desc: "Generación automática de libros y registros reglamentarios.",
  },
  {
    icon: Users,
    title: "Gestión de matrículas",
    desc: "Control completo de estudiantes, programas y matrículas con importación masiva.",
  },
  {
    icon: Shield,
    title: "Cumplimiento normativo",
    desc: "Actualizado con la ley de archivo y la normativa vigente en Educación",
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
    desc: "EduBot resuelve todas tus dudas sobre la gestión de libros y registros reglamentarios en Colombia",
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
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <img
            src="/logo_easydocs_blanco.png"
            alt="EasyDocs"
            className={`h-8 sm:h-10 w-auto object-contain transition-all ${scrolled ? "hidden" : "block"}`}
          />
          <img
            src="/logo_easydocs_azul.png"
            alt="EasyDocs"
            className={`h-8 sm:h-10 w-auto object-contain transition-all ${scrolled ? "block" : "hidden"}`}
          />
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate("/login")}
              className={`text-xs sm:text-sm font-medium px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors ${
                scrolled
                  ? "text-[#1a2b4a] hover:bg-gray-100"
                  : "text-white hover:bg-white/10"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate("/registro")}
              className="text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#2952cc] text-white hover:bg-[#1e3fa8] transition-colors whitespace-nowrap"
            >
              Registrarse gratis
            </button>
          </div>
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-28 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-3 sm:px-4 py-1.5 mb-5 sm:mb-6">
              <Shield size={14} className="text-blue-300 flex-shrink-0" />
              <span className="text-blue-200 text-xs font-medium">
                Plataforma para gestión de libros reglamentarios de
                establecimientos educativos
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5 sm:mb-6">
              Gestión documental para{" "}
              <span className="text-blue-300">
                Establecimientos Educativos en Colombia
              </span>{" "}
              sin complicaciones
            </h1>
            <p className="text-blue-100 text-base sm:text-lg mb-7 sm:mb-8 leading-relaxed">
              Genera, gestiona y descarga tus documentos reglamentarios
              cumpliendo con toda la normatividad en minutos. Automatiza el
              trabajo administrativo y enfócate en lo que importa: La Educación.
            </p>
          </div>

          {/* Card de acceso rápido */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8">
            <h3 className="text-white font-bold text-lg sm:text-xl mb-5 sm:mb-6">
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
                "Libros y registros reglamentarios institucionales",
                "Asistente virtual EduBot",
                "Calendario institucional automatizado ",
                "Registro de matrículas y programas",
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
      <section className="bg-[#1a2b4a] py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon size={22} className="text-blue-400 mx-auto mb-2 sm:mb-3" />
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {value}
              </p>
              <p className="text-blue-300 text-xs sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-14 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-[#2952cc] text-sm font-semibold uppercase tracking-wide">
              Funcionalidades
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2b4a] mt-2 mb-4">
              Todo lo que necesita tu institución
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
              Diseñado específicamente para gestión y administración de libros y
              registros reglamentarios de los establecimientos educativos en
              Colombia
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#2952cc]" />
                </div>
                <h3 className="font-bold text-[#1a2b4a] mb-2 text-sm sm:text-base">
                  {title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Decreto banner */}
      <section className="py-12 sm:py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#1a2b4a] flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-[#1a2b4a] text-base sm:text-lg mb-1">
                Decreto 1075 de 2015
              </h3>
              <p className="text-gray-500 text-sm max-w-xl">
                EasyDocs está alineado con todos los requerimientos normativos
                de la ley de archivo y la reglamentación de Educación en todas
                las modalidades en Colombia.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/registro")}
            className="w-full lg:w-auto flex-shrink-0 bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            Registrar institución <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Contacto */}
      <section className="py-12 sm:py-16 bg-[#1a2b4a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            {"¿Tienes preguntas?"}
          </h2>
          <p className="text-blue-200 mb-6 text-sm">
            {"Nuestro equipo de EduDynamis está disponible para ayudarte."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
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
              onClick={() => window.open("http://www.edudynamis.com", "_blank")}
              className="flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors"
            >
              www.edudynamis.com
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1b35] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-blue-400 text-xs text-center sm:text-left">
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

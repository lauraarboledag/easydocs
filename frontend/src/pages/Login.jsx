import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.access_token, res.data.user);

      // Redirigir según rol
      if (res.data.user.role === "superadmin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || "Correo o contraseña incorrectos.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-12 text-white overflow-hidden">
        {/* Video de fondo */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/Login.mp4" type="video/mp4" />
        </video>

        {/* Capa azul semitransparente */}
        <div className="absolute inset-0 bg-[#1a2b4a]/80" />

        {/* Contenido encima */}
        <div className="relative z-10 max-w-md">
          <div className="mb-12">
            <img
              src="/logo_easydocs_blanco.png"
              alt="EasyDocs"
              className="h-32 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-6">
            Bienvenido
          </h1>
          <p className="text-blue-200 text-lg">
            Accede a tu plataforma de gestión documental institucional.
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12 bg-white animate-fade-in-up">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-10 lg:hidden">
            <img
              src="/logo_easydocs_blanco.png"
              alt="EasyDocs"
              className="h-20 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Iniciar sesión
          </h2>
          <p className="text-gray-500 mb-8">
            Ingresa tus credenciales para acceder a tu institución.
          </p>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-8 transition-colors"
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
            Volver al inicio
          </button>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo institucional
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@institucion.edu.co"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Tu contraseña"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-8">
            ¿No tienes cuenta?{" "}
            <Link
              to="/registro"
              className="text-[#2952cc] font-medium hover:underline"
            >
              Registra tu institución
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

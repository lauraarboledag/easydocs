import { useState, useEffect } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  useEffect(() => {
    if (!blockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((new Date(blockedUntil) - new Date()) / 1000);
      if (remaining <= 0) {
        setBlockedUntil(null);
        setCountdown(null);
        setAttemptsLeft(null);
        setError("");
        clearInterval(interval);
      } else {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        setCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (blockedUntil) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
      const { access_token, user: userData } = res.data;
      login(access_token, userData);
      navigate(userData?.role === "superadmin" ? "/admin" : "/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "object" && detail !== null) {
        if (detail.blocked) {
          setBlockedUntil(detail.unlock_at);
          setError(
            `Cuenta bloqueada. Intenta de nuevo en ${detail.remaining_minutes} minuto${detail.remaining_minutes !== 1 ? "s" : ""}.`,
          );
          setAttemptsLeft(null);
        } else {
          setAttemptsLeft(detail.attempts_left);
          setError(
            `Contraseña incorrecta. Te quedan ${detail.attempts_left} intento${detail.attempts_left !== 1 ? "s" : ""}.`,
          );
        }
      } else {
        setError("Correo o contraseña incorrectos.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-12 text-white overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/Login.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#1a2b4a]/80" />
        <div className="relative z-10 max-w-md">
          <div className="mb-12">
            <img
              src="/logo_easydocs_blanco.png"
              alt="EasyDocs"
              className="h-32 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-6">Bienvenido</h1>
          <p className="text-blue-200 text-lg">
            Accede a tu plataforma de gestión documental institucional.
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12 bg-white">
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
            <div
              className={`border px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-5 ${
                blockedUntil
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-yellow-50 border-yellow-200 text-yellow-700"
              }`}
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              <div className="flex-1">
                <p>{error}</p>
                {countdown && (
                  <p className="font-mono font-bold text-lg mt-1">
                    {countdown}
                  </p>
                )}
              </div>
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
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#2952cc] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  required
                  disabled={!!blockedUntil}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2952cc] pr-10 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {attemptsLeft !== null && (
                <p className="text-xs text-yellow-600 mt-1">
                  Intentos restantes: {attemptsLeft}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !!blockedUntil}
              className="w-full bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              {loading
                ? "Ingresando..."
                : blockedUntil
                  ? `Bloqueado ${countdown || ""}`
                  : "Ingresar"}
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

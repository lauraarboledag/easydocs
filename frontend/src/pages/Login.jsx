import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  FileText,
  ChevronLeft,
  Mail,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function VerifyCodeForm({ userId, email, onBack }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5) {
      const code = newDigits.join("");
      if (code.length === 6) handleVerify(code);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split("");
      setDigits(newDigits);
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/verify-2fa", { user_id: userId, code });
      const { access_token, user: userData } = res.data;
      login(access_token, userData);
      navigate(userData?.role === "superadmin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Código inválido o expirado.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await api.post("/auth/resend-2fa", { user_id: userId, code: "" });
      setResendCooldown(30);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Error al reenviar el código. Intenta de nuevo.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8 transition-colors"
      >
        <ChevronLeft size={16} /> Volver
      </button>

      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[#f0f4ff]">
          <Mail size={24} className="text-[#2952cc]" />
        </div>
        <h2 className="text-3xl font-bold text-[#1a2b4a] mb-2">
          Verifica tu identidad
        </h2>
        <p className="text-gray-500 text-sm">
          {"Enviamos un código de 6 dígitos a "}
          <span className="font-medium text-gray-700">{email}</span>
        </p>
      </div>

      {error && (
        <div className="border px-4 py-3 rounded-lg text-sm flex items-start gap-2 mb-6 bg-red-50 border-red-200 text-red-700">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#2952cc] disabled:bg-gray-50 transition-colors"
          />
        ))}
      </div>

      <button
        onClick={() => handleVerify(digits.join(""))}
        disabled={loading || digits.some((d) => !d)}
        className="w-full bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3.5 px-6 rounded-lg transition-colors"
      >
        {loading ? "Verificando..." : "Verificar código"}
      </button>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-500 mb-2">
          {"¿No recibiste el código?"}
        </p>
        <button
          onClick={handleResend}
          disabled={resending || resendCooldown > 0}
          className="text-sm font-medium text-[#2952cc] hover:underline disabled:text-gray-400 disabled:no-underline"
        >
          {resending
            ? "Reenviando..."
            : resendCooldown > 0
              ? `Reenviar en ${resendCooldown}s`
              : "Reenviar código"}
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [pending2FA, setPending2FA] = useState(null); // { userId, email }

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
      if (res.data.requires_2fa) {
        setPending2FA({ userId: res.data.user_id, email: form.email });
      }
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
      {/* Panel izquierdo — video + info */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/login_video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#0d1b35]/85" />

        <div className="relative z-10">
          <img
            src="/logo_easydocs_blanco.png"
            alt="EasyDocs"
            className="h-16 w-auto object-contain"
          />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
            <Shield size={13} className="text-blue-300" />
            <span className="text-blue-200 text-xs font-medium">
              {"Plataforma oficial para instituciones ETDH"}
            </span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Bienvenido de nuevo
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed mb-8">
            {
              "Accede a tu plataforma de gestión documental y continúa con el trabajo administrativo de tu institución."
            }
          </p>

          <div className="space-y-3">
            {[
              {
                icon: FileText,
                text: "LR001 – LR009 y certificados Capítulo II",
              },
              { icon: Shield, text: "Cumplimiento Decreto 1075 de 2015" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3"
              >
                <Icon size={16} className="text-blue-300 flex-shrink-0" />
                <span className="text-blue-100 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-400 text-xs">
            {"© 2026 EasyDocs \u00B7 EduDynamis"}
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12 bg-white">
        <div className="max-w-md mx-auto w-full">
          {pending2FA ? (
            <VerifyCodeForm
              userId={pending2FA.userId}
              email={pending2FA.email}
              onBack={() => setPending2FA(null)}
            />
          ) : (
            <>
              <div className="mb-10 lg:hidden">
                <img
                  src="/logo_easydocs_blanco.png"
                  alt="EasyDocs"
                  className="h-14 w-auto object-contain"
                />
              </div>

              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8 transition-colors"
              >
                <ChevronLeft size={16} /> Volver al inicio
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#1a2b4a] mb-2">
                  Iniciar sesión
                </h2>
                <p className="text-gray-500 text-sm">
                  Ingresa tus credenciales para acceder a tu institución.
                </p>
              </div>

              {error && (
                <div
                  className={`border px-4 py-3 rounded-lg text-sm flex items-start gap-2 mb-6 ${
                    blockedUntil
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-yellow-50 border-yellow-200 text-yellow-700"
                  }`}
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
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
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Correo institucional
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="correo@institucion.edu.co"
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {"Contraseña"}
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[#2952cc] hover:underline"
                    >
                      {"¿Olvidaste tu contraseña?"}
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
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2952cc] focus:border-transparent pr-10 disabled:bg-gray-50 disabled:text-gray-400 transition-all"
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
                    <p className="text-xs text-yellow-600 mt-1.5">
                      {"Intentos restantes: "}
                      {attemptsLeft}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !!blockedUntil}
                  className="w-full bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3.5 px-6 rounded-lg transition-colors mt-2"
                >
                  {loading
                    ? "Ingresando..."
                    : blockedUntil
                      ? `Bloqueado ${countdown || ""}`
                      : "Ingresar"}
                </button>
              </form>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">o</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-3">
                  {"¿Tu institución aún no está registrada?"}
                </p>
                <button
                  onClick={() => navigate("/registro")}
                  className="w-full border-2 border-[#2952cc] text-[#2952cc] hover:bg-[#2952cc] hover:text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm"
                >
                  Registrar institución
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-6">
                {
                  "Alineado con el Decreto 1075 de 2015 para instituciones ETDH en Colombia."
                }
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

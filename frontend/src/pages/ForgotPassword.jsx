import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err) {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo_easydocs_azul.png"
            alt="EasyDocs"
            className="h-20 w-auto object-contain mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-gray-500 text-sm">
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              ¡Correo enviado!
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Si el correo existe en nuestro sistema, recibirás un enlace de
              recuperación en los próximos minutos.
            </p>
            <Link
              to="/login"
              className="text-[#2952cc] font-medium hover:underline text-sm"
            >
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo institucional
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@institucion.edu.co"
                  required
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link
                to="/login"
                className="text-[#2952cc] font-medium hover:underline"
              >
                Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

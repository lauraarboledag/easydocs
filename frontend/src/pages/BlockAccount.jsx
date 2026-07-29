import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import api from "../services/api";

export default function BlockAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState("confirm"); // confirm | loading | success | error
  const [message, setMessage] = useState("");

  const handleConfirm = async () => {
    setStep("loading");
    try {
      const res = await api.post("/auth/block-account", { token });
      setMessage(res.data.message);
      setStep("success");
    } catch (err) {
      setMessage(
        err.response?.data?.detail ||
          "No se pudo bloquear la cuenta. El enlace puede haber expirado.",
      );
      setStep("error");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#1a2b4a] mb-2">
            Enlace inválido
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Este enlace no es válido o está incompleto.
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-[#2952cc] font-medium hover:underline text-sm"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {step === "confirm" && (
          <>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-red-50">
              <ShieldAlert size={26} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] mb-2">
              ¿Bloquear esta cuenta?
            </h1>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Si no reconoces el inicio de sesión reportado, esta acción
              bloqueará inmediatamente el acceso a la cuenta por seguridad.
              Podrás recuperar el acceso más adelante usando la opción de
              recuperar contraseña o contactando soporte.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                Sí, bloquear cuenta
              </button>
            </div>
          </>
        )}

        {step === "loading" && (
          <div className="text-center py-8">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Bloqueando cuenta...</p>
          </div>
        )}

        {step === "success" && (
          <>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-green-50">
              <CheckCircle size={26} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] mb-2">
              Cuenta bloqueada
            </h1>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {message} Contacta a soporte en{" "}
              <a
                href="mailto:soporte@edudynamis.com"
                className="text-[#2952cc] hover:underline"
              >
                soporte@edudynamis.com
              </a>{" "}
              para recuperar el acceso.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              Ir al inicio
            </button>
          </>
        )}

        {step === "error" && (
          <>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-red-50">
              <AlertCircle size={26} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] mb-2">
              No se pudo procesar
            </h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mx-auto transition-colors"
            >
              <ChevronLeft size={16} /> Volver al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}

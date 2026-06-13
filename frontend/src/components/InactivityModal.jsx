import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function InactivityModal({ onContinue, onLogout }) {
  const [seconds, setSeconds] = useState(120);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onLogout]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
            <Clock size={18} className="text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800 font-mono">
            {mins}:{secs.toString().padStart(2, "0")}
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">¿Sigues ahí?</h3>
        <p className="text-sm text-gray-500 mb-6">
          Tu sesión cerrará pronto por inactividad. ¿Deseas continuar?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cerrar sesión
          </button>
          <button
            onClick={onContinue}
            className="flex-1 bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            Continuar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

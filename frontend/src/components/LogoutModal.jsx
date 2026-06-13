import { LogOut, X } from "lucide-react";

export default function LogoutModal({ onConfirm, onCancel, message }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <LogOut size={18} className="text-red-500" />
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          ¿Cerrar sesión?
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          {message ||
            "Tu sesión se cerrará y tendrás que volver a iniciar sesión para acceder a la plataforma."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

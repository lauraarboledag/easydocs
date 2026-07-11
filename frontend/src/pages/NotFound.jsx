import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FileQuestion, Home, ChevronLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleHome = () => {
    if (!user) navigate("/");
    else if (user.role === "superadmin") navigate("/admin");
    else navigate("/dashboard");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="text-center max-w-md px-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "var(--color-primary-light)" }}
        >
          <FileQuestion size={40} style={{ color: "var(--color-primary)" }} />
        </div>

        <h1
          className="text-6xl font-bold mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          404
        </h1>
        <h2
          className="text-xl font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Página no encontrada
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          La página que buscas no existe o fue movida. Verifica la URL o regresa
          al inicio.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-medium transition-colors"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-secondary)",
            }}
          >
            <ChevronLeft size={16} /> Volver
          </button>
          <button
            onClick={handleHome}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Home size={16} /> Ir al inicio
          </button>
        </div>

        <p className="text-xs mt-8" style={{ color: "var(--text-secondary)" }}>
          EasyDocs · EduDynamis
        </p>
      </div>
    </div>
  );
}

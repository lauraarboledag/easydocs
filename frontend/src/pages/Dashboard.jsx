import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import EduBot from "../components/EduBot";
import {
  FileText,
  Plus,
  FileCheck,
  TrendingUp,
  Shield,
  Bell,
  CheckCircle,
  FilePen,
  Award,
  BarChart3,
  ClipboardList,
} from "lucide-react";

const STATUS_STYLES = {
  generated: {
    bg: "var(--color-primary-light)",
    color: "var(--color-primary)",
  },
  draft: { bg: "#f3f4f6", color: "#6b7280" },
  ai_draft: { bg: "#fef3c7", color: "#b45309" },
  cancelled: { bg: "#fee2e2", color: "#dc2626" },
};

const STATUS_LABELS = {
  generated: "Generado",
  draft: "Borrador",
  ai_draft: "Borrador IA",
  cancelled: "Cancelado",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);

  useInactivity({
    timeout: 30,
    onWarning: () => setShowInactivity(true),
    onLogout: () => {
      setShowInactivity(false);
      logout();
      navigate("/");
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, templatesRes] = await Promise.all([
          api.get("/documents/"),
          api.get("/templates/"),
        ]);
        setDocuments(docsRes.data);
        setTemplates(templatesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const docsThisMonth = documents.filter((d) => {
    const date = new Date(d.created_at);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  const pendingDrafts = documents.filter((d) => d.status === "ai_draft").length;

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="ml-56 flex-1 flex flex-col">
        {/* Topbar */}
        <header
          className="border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          <h1
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Panel de Control
          </h1>
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <Bell size={20} />
              {pendingDrafts > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user?.full_name}
                </p>
                <p
                  className="text-xs capitalize"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">
          {/* Banner de bienvenida */}
          <div
            className="rounded-2xl p-8 mb-8 flex items-center justify-between"
            style={{
              background: `linear-gradient(to right, var(--color-banner-from), var(--color-banner-to))`,
            }}
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                ¡Bienvenido, {user?.full_name?.split(" ")[0]}!
              </h2>
              <p className="text-white/80 mb-6">
                Gestiona los documentos reglamentarios de tu institución desde
                aquí.
              </p>
              <button
                onClick={() => navigate("/documentos/nuevo")}
                className="bg-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors hover:opacity-90"
                style={{ color: "var(--color-primary)" }}
              >
                <Plus size={18} />
                Generar documento
              </button>
            </div>
            <div className="hidden lg:block opacity-20">
              <FileText size={120} className="text-white" />
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Documentos mes",
                value: documents.length,
                icon: TrendingUp,
                sub: "Total generados",
              },
              {
                label: "Plantillas",
                value: templates.length,
                icon: FileCheck,
                sub: "Disponibles",
              },
              {
                label: "Borradores IA",
                value: pendingDrafts,
                icon: Bell,
                sub: "Pendientes revisión",
                alert: pendingDrafts > 0,
              },
              {
                label: "Estado plan",
                value: "Activo",
                icon: Shield,
                sub: "Suscripción vigente",
              },
            ].map(({ label, value, icon: Icon, sub, alert }) => (
              <div
                key={label}
                className="rounded-xl p-5 border"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: alert ? "#fbbf24" : "var(--border-color)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs uppercase tracking-wide"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {label}
                  </span>
                  <Icon size={14} style={{ color: "var(--color-icon)" }} />
                </div>
                <p
                  className="text-3xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {value}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {sub}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Documentos recientes */}
            <div
              className="lg:col-span-2 rounded-xl border p-6"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Documentos Recientes
                </h3>
                <button
                  onClick={() => navigate("/documentos")}
                  className="text-sm hover:underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  Ver todos
                </button>
              </div>

              {loading ? (
                <div
                  className="text-center py-8 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cargando...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: "var(--color-primary-light)" }}
                  >
                    <FileText
                      size={32}
                      style={{ color: "var(--color-icon)" }}
                    />
                  </div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Sin documentos aún
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Genera tu primer documento reglamentario
                  </p>
                  <button
                    onClick={() => navigate("/documentos/nuevo")}
                    className="mt-4 text-sm font-medium hover:underline"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Generar ahora →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className="grid grid-cols-4 text-xs uppercase tracking-wide pb-2 border-b"
                    style={{
                      color: "var(--text-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <span className="col-span-2">Nombre / Tipo</span>
                    <span>Estado</span>
                    <span>Fecha</span>
                  </div>
                  {documents.slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      className="grid grid-cols-4 items-center py-2 rounded-lg px-2 -mx-2 transition-colors hover:bg-black/5"
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <FileText
                          size={14}
                          className="flex-shrink-0"
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <div>
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {doc.template_id}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {doc.status}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium w-fit"
                        style={{
                          backgroundColor: STATUS_STYLES[doc.status]?.bg,
                          color: STATUS_STYLES[doc.status]?.color,
                        }}
                      >
                        {STATUS_LABELS[doc.status]}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {new Date(doc.created_at).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accesos directos */}
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <h3
                className="font-semibold mb-5"
                style={{ color: "var(--text-primary)" }}
              >
                Accesos Directos
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Nueva Acta",
                    icon: FilePen,
                    path: "/documentos/nuevo",
                  },
                  {
                    label: "Certificado",
                    icon: Award,
                    path: "/documentos/nuevo",
                  },
                  {
                    label: "Matrícula",
                    icon: ClipboardList,
                    path: "/matriculas",
                  },
                  {
                    label: "Calificaciones",
                    icon: BarChart3,
                    path: "/documentos/nuevo",
                  },
                ].map(({ label, icon: Icon, path }) => (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-transparent transition-colors"
                    style={{ backgroundColor: "var(--bg-primary)" }}
                  >
                    <Icon size={22} style={{ color: "var(--color-icon)" }} />
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              <div
                className="mt-6 pt-5 border-t"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Documentos usados
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {documents.length} / ∞
                  </span>
                </div>
                <div
                  className="w-full rounded-full h-2"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((documents.length / 50) * 100, 100)}%`,
                      backgroundColor: "var(--color-primary)",
                    }}
                  />
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Plan activo
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <EduBot />
      {showLogout && (
        <LogoutModal
          onConfirm={() => {
            logout();
            navigate("/");
          }}
          onCancel={() => setShowLogout(false)}
        />
      )}
      {showInactivity && (
        <InactivityModal
          onContinue={() => setShowInactivity(false)}
          onLogout={() => {
            setShowInactivity(false);
            logout();
            navigate("/");
          }}
        />
      )}
    </div>
  );
}

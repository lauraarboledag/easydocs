import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoutModal from "../components/LogoutModal";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import {
  LayoutDashboard,
  FileText,
  Users,
  GraduationCap,
  ClipboardList,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Plus,
  FileCheck,
  FilePen,
  Award,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Shield,
} from "lucide-react";

const STATUS_STYLES = {
  generated: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  ai_draft: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-600",
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

  const handleLogout = () => setShowLogout(true);
  const confirmLogout = () => {
    logout();
    navigate("/");
  };

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
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />
      {/* Contenido principal */}
      <main className="ml-56 flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-gray-800">
            Panel de Control
          </h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
              {pendingDrafts > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2952cc] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">
          {/* Banner de bienvenida */}
          <div className="bg-[#1a2b4a] rounded-2xl p-8 mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                ¡Bienvenido, {user?.full_name?.split(" ")[0]}!
              </h2>
              <p className="text-blue-200 mb-6">
                Gestiona los documentos reglamentarios de tu institución desde
                aquí.
              </p>
              <button
                onClick={() => navigate("/documentos/nuevo")}
                className="bg-[#2952cc] hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
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
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Documentos mes
                </span>
                <TrendingUp size={14} className="text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {documents.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">Total generados</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Plantillas
                </span>
                <FileCheck size={14} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {templates.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">Disponibles</p>
            </div>

            <div
              className={`bg-white rounded-xl p-5 border ${pendingDrafts > 0 ? "border-yellow-200" : "border-gray-100"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Borradores IA
                </span>
                {pendingDrafts > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    Alerta
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {pendingDrafts}
              </p>
              <p className="text-xs text-gray-400 mt-1">Pendientes revisión</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Estado plan
                </span>
                <Shield size={14} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">Activo</p>
              <p className="text-xs text-gray-400 mt-1">Suscripción vigente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Documentos recientes */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-800">
                  Documentos Recientes
                </h3>
                <button
                  onClick={() => navigate("/documentos")}
                  className="text-sm text-[#2952cc] hover:underline"
                >
                  Ver todos
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Cargando...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Sin documentos aún
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Genera tu primer documento reglamentario
                  </p>
                  <button
                    onClick={() => navigate("/documentos/nuevo")}
                    className="mt-4 text-sm text-[#2952cc] font-medium hover:underline"
                  >
                    Generar ahora →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 text-xs text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-50">
                    <span className="col-span-2">Nombre / Tipo</span>
                    <span>Estado</span>
                    <span>Fecha</span>
                  </div>
                  {documents.slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      className="grid grid-cols-4 items-center py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <FileText
                          size={14}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {doc.template_id}
                          </p>
                          <p className="text-xs text-gray-400">{doc.status}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${STATUS_STYLES[doc.status]}`}
                      >
                        {STATUS_LABELS[doc.status]}
                      </span>
                      <span className="text-xs text-gray-400">
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
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-5">
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
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 hover:bg-blue-50 hover:border-blue-100 border border-transparent rounded-xl transition-colors"
                  >
                    <Icon size={22} className="text-[#2952cc]" />
                    <span className="text-xs font-medium text-gray-600">
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    Documentos usados
                  </span>
                  <span className="text-xs font-medium text-gray-700">
                    {documents.length} / ∞
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-[#2952cc] h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((documents.length / 50) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Plan activo</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* EduBot flotante */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#1a2b4a] hover:bg-[#2952cc] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50">
        <MessageSquare size={22} />
      </button>
      {showLogout && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </div>
  );
}

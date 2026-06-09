import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  FileText,
  Plus,
  Download,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  FilePen,
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  MessageSquare,
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

const STATUS_ICONS = {
  generated: CheckCircle,
  draft: FilePen,
  ai_draft: Clock,
  cancelled: XCircle,
};

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Documentos", icon: FileText, path: "/documentos" },
  { label: "Usuarios", icon: Users, path: "/usuarios" },
  { label: "Estudiantes", icon: GraduationCap, path: "/estudiantes" },
  { label: "Matrículas", icon: ClipboardList, path: "/matriculas" },
  { label: "Suscripción", icon: CreditCard, path: "/suscripcion" },
];

export default function DocumentList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [downloading, setDownloading] = useState(null);

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

  const getTemplateName = (templateId) => {
    const template = templates.find((t) => t.id === templateId);
    return template?.name || "Documento";
  };

  const handleDownload = async (doc) => {
    setDownloading(doc.id);
    try {
      const res = await api.get(`/documents/${doc.id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `documento_${doc.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Actualizar estado del documento a generated
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, status: "generated" } : d)),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  const handleCancel = async (docId) => {
    if (!confirm("¿Estás seguro de que deseas cancelar este documento?"))
      return;
    try {
      await api.patch(`/documents/${docId}/cancel`);
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: "cancelled" } : d)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = documents.filter((doc) => {
    const name = getTemplateName(doc.template_id).toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || doc.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a2b4a] flex flex-col fixed h-full">
        <div className="p-6 border-b border-blue-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#1a2b4a]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm">EasyDocs</p>
              <p className="text-blue-300 text-xs">Gestión Institucional</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                location.pathname === path
                  ? "bg-blue-800 text-white"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-900 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition-colors">
            <Settings size={16} /> Configuración
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-red-800 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="ml-56 flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Documentos</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2952cc] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">
          {/* Header de sección */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Historial de documentos
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {documents.length} documento{documents.length !== 1 ? "s" : ""}{" "}
                en total
              </p>
            </div>
            <button
              onClick={() => navigate("/documentos/nuevo")}
              className="bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Nuevo documento
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar por tipo de documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2952cc] bg-white"
              >
                <option value="all">Todos los estados</option>
                <option value="generated">Generados</option>
                <option value="draft">Borradores</option>
                <option value="ai_draft">Borradores IA</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>

          {/* Lista de documentos */}
          <div className="bg-white rounded-xl border border-gray-100">
            {loading ? (
              <div className="text-center py-16 text-gray-400">
                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Cargando documentos...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">
                  {search || filterStatus !== "all"
                    ? "Sin resultados"
                    : "Sin documentos aún"}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {search || filterStatus !== "all"
                    ? "Intenta con otros filtros"
                    : "Genera tu primer documento reglamentario"}
                </p>
                {!search && filterStatus === "all" && (
                  <button
                    onClick={() => navigate("/documentos/nuevo")}
                    className="mt-4 text-sm text-[#2952cc] font-medium hover:underline"
                  >
                    Generar ahora →
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Header tabla */}
                <div className="grid grid-cols-12 text-xs text-gray-400 uppercase tracking-wide px-6 py-3 border-b border-gray-50">
                  <span className="col-span-5">Documento</span>
                  <span className="col-span-2">Estado</span>
                  <span className="col-span-3">Fecha</span>
                  <span className="col-span-2 text-right">Acciones</span>
                </div>

                {filtered.map((doc) => {
                  const StatusIcon = STATUS_ICONS[doc.status] || FileText;
                  return (
                    <div
                      key={doc.id}
                      className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-[#2952cc]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {getTemplateName(doc.template_id)}
                          </p>
                          <p className="text-xs text-gray-400 font-mono truncate max-w-48">
                            {doc.id.split("-")[0]}...
                          </p>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[doc.status]}`}
                        >
                          <StatusIcon size={11} />
                          {STATUS_LABELS[doc.status]}
                        </span>
                      </div>

                      <div className="col-span-3">
                        <p className="text-sm text-gray-600">
                          {new Date(doc.created_at).toLocaleDateString(
                            "es-CO",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(doc.created_at).toLocaleTimeString(
                            "es-CO",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2">
                        {doc.status !== "cancelled" && (
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.id}
                            className="flex items-center gap-1.5 text-xs bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-200 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            {downloading === doc.id ? (
                              <span>Generando...</span>
                            ) : (
                              <>
                                <Download size={12} />
                                PDF
                              </>
                            )}
                          </button>
                        )}
                        {doc.status === "draft" && (
                          <button
                            onClick={() => handleCancel(doc.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancelar documento"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Resumen de estados */}
          {documents.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-6">
              {Object.entries(STATUS_LABELS).map(([status, label]) => {
                const count = documents.filter(
                  (d) => d.status === status,
                ).length;
                const Icon = STATUS_ICONS[status];
                return (
                  <button
                    key={status}
                    onClick={() =>
                      setFilterStatus(status === filterStatus ? "all" : status)
                    }
                    className={`bg-white rounded-xl border p-4 flex items-center gap-3 transition-colors hover:border-[#2952cc] ${
                      filterStatus === status
                        ? "border-[#2952cc] bg-blue-50"
                        : "border-gray-100"
                    }`}
                  >
                    <span className={`p-2 rounded-lg ${STATUS_STYLES[status]}`}>
                      <Icon size={14} />
                    </span>
                    <div className="text-left">
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* EduBot flotante */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#1a2b4a] hover:bg-[#2952cc] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50">
        <MessageSquare size={22} />
      </button>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import Sidebar from "../components/layout/Sidebar";
import EduBot from "../components/EduBot";
import useInactivity from "../hooks/useInactivity";
import InactivityModal from "../components/InactivityModal";
import {
  FileText,
  Plus,
  Download,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  CheckCircle,
  Clock,
  FilePen,
  Bell,
} from "lucide-react";

const STATUS_STYLES = {
  generated: {
    bg: "var(--color-primary-light)",
    color: "var(--color-primary)",
    cardBg: "var(--color-primary-light)",
  },
  draft: { bg: "#f3f4f6", color: "#6b7280", cardBg: "#f9fafb" },
  ai_draft: { bg: "#fef3c7", color: "#b45309", cardBg: "#fffbeb" },
  cancelled: { bg: "#fee2e2", color: "#dc2626", cardBg: "#fff5f5" },
};

const STATUS_LABELS = {
  generated: "Generados",
  draft: "Borradores",
  ai_draft: "Borradores IA",
  cancelled: "Cancelados",
};

const STATUS_ICONS = {
  generated: CheckCircle,
  draft: FilePen,
  ai_draft: Clock,
  cancelled: XCircle,
};

export default function DocumentList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [downloading, setDownloading] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);

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

  useInactivity({
    timeout: 30,
    onWarning: () => setShowInactivity(true),
    onLogout: () => {
      setShowInactivity(false);
      logout();
      navigate("/");
    },
  });

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Documentos
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {documents.length} documento{documents.length !== 1 ? "s" : ""}{" "}
                en total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2" style={{ color: "var(--text-secondary)" }}>
              <Bell size={20} />
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
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">
          {/* Header + botón nuevo */}
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Historial de documentos
            </h2>
            <button
              onClick={() => navigate("/documentos/nuevo")}
              className="text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Plus size={18} />
              Nuevo documento
            </button>
          </div>

          {/* Tarjetas resumen ARRIBA — filtros rápidos */}
          {documents.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              {Object.entries(STATUS_LABELS).map(([status, label]) => {
                const count = documents.filter(
                  (d) => d.status === status,
                ).length;
                const Icon = STATUS_ICONS[status];
                const style = STATUS_STYLES[status];
                const isActive = filterStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(isActive ? "all" : status)}
                    className="rounded-xl border p-4 flex items-center gap-3 transition-all hover:shadow-sm text-left"
                    style={{
                      backgroundColor: isActive
                        ? style.cardBg
                        : "var(--bg-secondary)",
                      borderColor: isActive
                        ? style.color
                        : "var(--border-color)",
                      borderWidth: isActive ? "2px" : "1px",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: style.bg }}
                    >
                      <Icon size={16} style={{ color: style.color }} />
                    </div>
                    <div>
                      <p
                        className="text-2xl font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {count}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Filtros */}
          <div
            className="rounded-xl border p-4 mb-6 flex flex-col sm:flex-row gap-3"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-secondary)" }}
              />
              <input
                type="text"
                placeholder="Buscar por tipo de documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} style={{ color: "var(--text-secondary)" }} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
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
          <div
            className="rounded-xl border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            {loading ? (
              <div
                className="text-center py-16"
                style={{ color: "var(--text-secondary)" }}
              >
                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Cargando documentos...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  <FileText
                    size={32}
                    style={{ color: "var(--text-secondary)", opacity: 0.4 }}
                  />
                </div>
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {search || filterStatus !== "all"
                    ? "Sin resultados"
                    : "Sin documentos aún"}
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {search || filterStatus !== "all"
                    ? "Intenta con otros filtros"
                    : "Genera tu primer documento reglamentario"}
                </p>
                {!search && filterStatus === "all" && (
                  <button
                    onClick={() => navigate("/documentos/nuevo")}
                    className="mt-4 text-sm font-medium hover:underline"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Generar ahora →
                  </button>
                )}
              </div>
            ) : (
              <>
                <div
                  className="grid grid-cols-12 text-xs uppercase tracking-wide px-6 py-3 border-b"
                  style={{
                    color: "var(--text-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <span className="col-span-5">Documento</span>
                  <span className="col-span-2">Estado</span>
                  <span className="col-span-3">Fecha</span>
                  <span className="col-span-2 text-right">Acciones</span>
                </div>

                {filtered.map((doc) => {
                  const StatusIcon = STATUS_ICONS[doc.status] || FileText;
                  const style =
                    STATUS_STYLES[doc.status] || STATUS_STYLES.draft;
                  return (
                    <div
                      key={doc.id}
                      className="grid grid-cols-12 items-center px-6 py-4 border-b last:border-0 transition-colors"
                      style={{ borderColor: "var(--border-color)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--bg-primary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: "var(--color-primary-light)",
                          }}
                        >
                          <FileText
                            size={16}
                            style={{ color: "var(--color-icon)" }}
                          />
                        </div>
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {getTemplateName(doc.template_id)}
                          </p>
                          <p
                            className="text-xs font-mono"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {doc.id.split("-")[0]}...
                          </p>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: style.bg,
                            color: style.color,
                          }}
                        >
                          <StatusIcon size={11} />
                          {STATUS_LABELS[doc.status]}
                        </span>
                      </div>

                      <div className="col-span-3">
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {new Date(doc.created_at).toLocaleDateString(
                            "es-CO",
                            { day: "2-digit", month: "long", year: "numeric" },
                          )}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {new Date(doc.created_at).toLocaleTimeString(
                            "es-CO",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2">
                        {doc.status !== "cancelled" && (
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.id}
                            className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40"
                            style={{ backgroundColor: "var(--color-primary)" }}
                          >
                            {downloading === doc.id ? (
                              <span>Generando...</span>
                            ) : (
                              <>
                                <Download size={12} /> PDF
                              </>
                            )}
                          </button>
                        )}
                        {doc.status === "draft" && (
                          <button
                            onClick={() => handleCancel(doc.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: "var(--text-secondary)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#dc2626";
                              e.currentTarget.style.backgroundColor = "#fee2e2";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color =
                                "var(--text-secondary)";
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
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

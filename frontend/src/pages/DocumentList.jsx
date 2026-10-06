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
  Trash2,
  PlayCircle,
  AlertCircle,
  X,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";

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

// Etiqueta de cada fila (singular)
const STATUS_BADGE = {
  generated: "Generado",
  draft: "Borrador",
  ai_draft: "Borrador IA",
  cancelled: "Cancelado",
};

// Estados que todavía se pueden seguir editando
const EDITABLE_STATUSES = ["draft", "ai_draft"];

const formatDate = (value) =>
  new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

// Con responseType "blob", el error del backend llega como Blob: se lee el texto
const readBlobError = async (err, fallback) => {
  try {
    const data = err.response?.data;
    if (data instanceof Blob) {
      const json = JSON.parse(await data.text());
      if (typeof json.detail === "string") return json.detail;
    } else if (typeof data?.detail === "string") {
      return data.detail;
    }
  } catch {
    // sin detalle legible
  }
  return fallback;
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

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
        setError("Error al cargar documentos. Recarga la página");
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
    setError(null);
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
      setError(
        await readBlobError(err, "Error al descargar documento. Intenta de nuevo más tarde"),
      );
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
      setError("Error al cancelar. Intenta de nuevo más tarde");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${deleteTarget.id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError("Error al eliminar documento. Intenta de nuevo más tarde");
    } finally {
      setDeleting(false);
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
      className="min-h-screen flex overflow-x-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="md:ml-56 flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="border-b pl-16 pr-4 md:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-10"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1
                className="text-lg font-semibold truncate"
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
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button className="p-2" style={{ color: "var(--text-secondary)" }}>
              <NotificationBell />
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
                className="hidden md:block text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8">
          {/* Header + botón nuevo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Historial de documentos
            </h2>
            <button
              onClick={() => navigate("/documentos/nuevo")}
              className="text-white font-semibold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Plus size={18} />
              Nuevo documento
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} title="Cerrar">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Tarjetas resumen ARRIBA — filtros rápidos */}
          {documents.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
                    className="rounded-xl border p-3 md:p-4 flex items-center gap-3 transition-all hover:shadow-sm text-left min-w-0"
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
                    <div className="min-w-0">
                      <p
                        className="text-2xl font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {count}
                      </p>
                      <p
                        className="text-xs truncate"
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
                className="flex-1 sm:flex-none text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2"
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
                  className="hidden md:grid grid-cols-12 text-xs uppercase tracking-wide px-6 py-3 border-b"
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
                  const isEditable = EDITABLE_STATUSES.includes(doc.status);
                  return (
                    <div
                      key={doc.id}
                      className="flex flex-col gap-3 md:grid md:grid-cols-12 md:items-center md:gap-0 px-4 md:px-6 py-4 border-b last:border-0 transition-colors"
                      style={{ borderColor: "var(--border-color)" }}
                      onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--bg-primary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
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
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium truncate"
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

                      <div className="col-span-2 flex items-center gap-3 md:block">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: style.bg,
                            color: style.color,
                          }}
                        >
                          <StatusIcon size={11} />
                          {STATUS_BADGE[doc.status] || doc.status}
                        </span>
                        {/* En celular la fecha va junto al estado */}
                        <span
                          className="md:hidden text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {formatDate(doc.created_at)} · {formatTime(doc.created_at)}
                        </span>
                      </div>

                      <div className="col-span-3 hidden md:block">
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {formatDate(doc.created_at)}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {formatTime(doc.created_at)}
                          {isEditable && doc.updated_at && (
                            <> · editado {formatDate(doc.updated_at)}</>
                          )}
                        </p>
                      </div>

                      <div className="col-span-2 flex items-center md:justify-end gap-2 flex-wrap">
                        {isEditable && (
                          <button
                            onClick={() =>
                              navigate(`/documentos/nuevo?draft=${doc.id}`)
                            }
                            className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                            style={{ backgroundColor: "var(--color-primary)" }}
                            title={
                              doc.status === "ai_draft"
                                ? "Revisar el texto de EduBot y generar"
                                : "Seguir llenando este borrador"
                            }
                          >
                            <PlayCircle size={12} />
                            {doc.status === "ai_draft" ? "Revisar" : "Continuar"}
                          </button>
                        )}
                        {/* Un borrador IA no se descarga hasta revisarlo */}
                        {!["cancelled", "ai_draft"].includes(doc.status) && (
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.id}
                            className={
                              isEditable
                                ? "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors disabled:opacity-40"
                                : "flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40"
                            }
                            style={
                              isEditable
                                ? {
                                  borderColor: "var(--border-color)",
                                  color: "var(--text-secondary)",
                                }
                                : { backgroundColor: "var(--color-primary)" }
                            }
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
                        {isEditable && (
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
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              id: doc.id,
                              name: getTemplateName(doc.template_id),
                            })
                          }
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
                          title="Eliminar documento"
                        >
                          <Trash2 size={16} />
                        </button>
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
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#fee2e2" }}
              >
                <Trash2 size={18} style={{ color: "#dc2626" }} />
              </div>
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Eliminar documento
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <p
              className="text-sm mb-5"
              style={{ color: "var(--text-secondary)" }}
            >
              ¿Deseas eliminar permanentemente{" "}
              <span
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {deleteTarget.name}
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-primary)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#dc2626" }}
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
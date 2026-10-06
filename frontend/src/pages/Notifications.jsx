import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import AdminSidebar from "../components/layout/AdminSidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import NotificationBell from "../components/NotificationBell";
import EduBot from "../components/EduBot";
import {
    Bell,
    ChevronLeft,
    CheckCheck,
    Check,
    Trash2,
    Eraser,
    ArrowRight,
    AlertCircle,
    CheckCircle,
    X,
} from "lucide-react";
import {
    getNotificationMeta,
    timeAgo,
    emitNotificationsChanged,
} from "../utils/notificationMeta";

const PAGE_SIZE = 30;

export default function Notifications() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isSuperadmin = user?.role === "superadmin";

    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("all"); // all | unread
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [selected, setSelected] = useState([]);
    const [working, setWorking] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
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

    const fetchPage = async (offset = 0) => {
        const res = await api.get("/notifications/", {
            params: { limit: PAGE_SIZE, offset, unread_only: filter === "unread" },
        });
        setHasMore(res.data.length === PAGE_SIZE);
        return res.data;
    };

    const reload = async () => {
        setLoading(true);
        setSelected([]);
        try {
            setNotifications(await fetchPage(0));
        } catch {
            setError("No se pudieron cargar las notificaciones.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const loadMore = async () => {
        setLoadingMore(true);
        try {
            const more = await fetchPage(notifications.length);
            setNotifications((prev) => [...prev, ...more]);
        } catch {
            setError("No se pudieron cargar más notificaciones.");
        } finally {
            setLoadingMore(false);
        }
    };

    const flash = (text) => {
        setMessage(text);
        setTimeout(() => setMessage(""), 3000);
    };

    const unreadInList = notifications.filter((n) => !n.is_read).length;
    const readInList = notifications.length - unreadInList;
    const allSelected =
        notifications.length > 0 && selected.length === notifications.length;

    const toggleSelect = (id) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const toggleSelectAll = () =>
        setSelected(allSelected ? [] : notifications.map((n) => n.id));

    const markRead = async (n) => {
        try {
            await api.patch(`/notifications/${n.id}/read`);
            setNotifications((prev) =>
                filter === "unread"
                    ? prev.filter((x) => x.id !== n.id)
                    : prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
            );
            emitNotificationsChanged();
        } catch {
            setError("No se pudo marcar como leída.");
        }
    };

    const markAllRead = async () => {
        setWorking(true);
        try {
            await api.patch("/notifications/read-all");
            emitNotificationsChanged();
            flash("Todas las notificaciones quedaron como leídas.");
            await reload();
        } catch {
            setError("No se pudieron marcar como leídas.");
        } finally {
            setWorking(false);
        }
    };

    const deleteIds = async (ids) => {
        if (ids.length === 0) return;
        setWorking(true);
        try {
            const res = await api.post("/notifications/delete", { ids });
            setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
            setSelected((prev) => prev.filter((id) => !ids.includes(id)));
            emitNotificationsChanged();
            const count = res.data.deleted ?? ids.length;
            flash(`${count} notificación${count !== 1 ? "es" : ""} eliminada${count !== 1 ? "s" : ""}.`);
        } catch {
            setError("No se pudieron eliminar.");
        } finally {
            setWorking(false);
        }
    };

    const clearRead = async () => {
        if (!confirm("¿Eliminar todas las notificaciones que ya leíste?")) return;
        setWorking(true);
        try {
            const res = await api.post("/notifications/clear-read");
            emitNotificationsChanged();
            const count = res.data.deleted || 0;
            flash(
                count > 0
                    ? `Bandeja limpia: ${count} notificación${count !== 1 ? "es" : ""} leída${count !== 1 ? "s" : ""} eliminada${count !== 1 ? "s" : ""}.`
                    : "No había notificaciones leídas para limpiar.",
            );
            await reload();
        } catch {
            setError("No se pudo limpiar la bandeja.");
        } finally {
            setWorking(false);
        }
    };

    const openNotification = (n, path) => {
        if (!n.is_read) markRead(n);
        if (path) navigate(path);
    };

    const SidebarComponent = isSuperadmin ? AdminSidebar : Sidebar;

    return (
        <div
            className="min-h-screen flex overflow-x-hidden"
            style={{ backgroundColor: "var(--bg-primary)" }}
        >
            <SidebarComponent onLogout={() => setShowLogout(true)} />

            <main className="md:ml-56 flex-1 flex flex-col min-w-0">
                <header
                    className="border-b pl-16 pr-4 md:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-20"
                    style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                    }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => navigate(isSuperadmin ? "/admin" : "/dashboard")}
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
                                Notificaciones
                            </h1>
                            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                Tu bandeja de avisos
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <NotificationBell />
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

                <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
                    {message && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                            <CheckCircle size={16} className="flex-shrink-0" /> {message}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span className="flex-1">{error}</span>
                            <button onClick={() => setError("")} title="Cerrar">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Filtros y acciones generales */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div
                            className="flex items-center rounded-xl p-1 self-start"
                            style={{ backgroundColor: "var(--bg-secondary)" }}
                        >
                            {[
                                { id: "all", label: "Todas" },
                                { id: "unread", label: "Sin leer" },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: filter === f.id ? "var(--color-primary)" : "transparent",
                                        color: filter === f.id ? "#ffffff" : "var(--text-secondary)",
                                    }}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={markAllRead}
                                disabled={working || unreadInList === 0}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border disabled:opacity-40"
                                style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                            >
                                <CheckCheck size={14} /> Marcar todas como leídas
                            </button>
                            <button
                                onClick={clearRead}
                                disabled={working || (filter === "all" && readInList === 0)}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border disabled:opacity-40"
                                style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                                title="Elimina todas las notificaciones que ya leíste"
                            >
                                <Eraser size={14} /> Limpiar leídas
                            </button>
                        </div>
                    </div>

                    <div
                        className="rounded-xl border overflow-hidden"
                        style={{
                            backgroundColor: "var(--bg-secondary)",
                            borderColor: "var(--border-color)",
                        }}
                    >
                        {/* Barra de selección */}
                        {notifications.length > 0 && (
                            <div
                                className="flex items-center justify-between gap-3 px-4 py-2.5 border-b"
                                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}
                            >
                                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4"
                                    />
                                    {selected.length > 0 ? `${selected.length} seleccionada${selected.length !== 1 ? "s" : ""}` : "Seleccionar todas"}
                                </label>
                                {selected.length > 0 && (
                                    <button
                                        onClick={() => deleteIds(selected)}
                                        disabled={working}
                                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                                        style={{ backgroundColor: "#dc2626" }}
                                    >
                                        <Trash2 size={13} /> Eliminar
                                    </button>
                                )}
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-16 text-sm" style={{ color: "var(--text-secondary)" }}>
                                Cargando notificaciones...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: "var(--bg-primary)" }}
                                >
                                    <Bell size={30} style={{ color: "var(--text-secondary)", opacity: 0.4 }} />
                                </div>
                                <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                                    {filter === "unread" ? "No tienes notificaciones sin leer" : "Tu bandeja está limpia"}
                                </p>
                                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                                    Aquí verás avisos de documentos, pagos, tu plan y el calendario.
                                </p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const meta = getNotificationMeta(n, isSuperadmin);
                                const Icon = meta.icon;
                                const isSelected = selected.includes(n.id);
                                return (
                                    <div
                                        key={n.id}
                                        className="flex items-start gap-3 px-4 py-4 border-b last:border-0"
                                        style={{
                                            borderColor: "var(--border-color)",
                                            backgroundColor: isSelected
                                                ? "var(--bg-primary)"
                                                : n.is_read
                                                    ? "transparent"
                                                    : "var(--color-primary-light)",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(n.id)}
                                            className="w-4 h-4 mt-2.5 flex-shrink-0"
                                            aria-label="Seleccionar notificación"
                                        />
                                        <div
                                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: n.is_read ? "var(--bg-primary)" : meta.bg }}
                                        >
                                            <Icon size={16} style={{ color: n.is_read ? "var(--text-secondary)" : meta.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-2">
                                                <p
                                                    className={`text-sm flex-1 min-w-0 break-words ${n.is_read ? "font-medium" : "font-semibold"}`}
                                                    style={{ color: "var(--text-primary)" }}
                                                >
                                                    {n.title}
                                                </p>
                                                {!n.is_read && (
                                                    <span
                                                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                                        style={{ backgroundColor: "var(--color-primary)" }}
                                                    />
                                                )}
                                            </div>
                                            {n.message && (
                                                <p className="text-sm mt-1 break-words" style={{ color: "var(--text-secondary)" }}>
                                                    {n.message}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                                <span
                                                    className="text-xs"
                                                    style={{ color: "var(--text-secondary)" }}
                                                    title={new Date(n.created_at).toLocaleString("es-CO")}
                                                >
                                                    {timeAgo(n.created_at)}
                                                </span>
                                                {meta.path && (
                                                    <button
                                                        onClick={() => openNotification(n, meta.path)}
                                                        className="text-xs font-medium flex items-center gap-1 hover:underline"
                                                        style={{ color: "var(--color-primary)" }}
                                                    >
                                                        Ver <ArrowRight size={12} />
                                                    </button>
                                                )}
                                                {!n.is_read && (
                                                    <button
                                                        onClick={() => markRead(n)}
                                                        className="text-xs font-medium flex items-center gap-1 hover:underline"
                                                        style={{ color: "var(--text-secondary)" }}
                                                    >
                                                        <Check size={12} /> Marcar como leída
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteIds([n.id])}
                                            disabled={working}
                                            className="p-2 rounded-lg flex-shrink-0 hover:bg-red-50 disabled:opacity-40"
                                            style={{ color: "#dc2626" }}
                                            title="Eliminar notificación"
                                            aria-label="Eliminar notificación"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {hasMore && !loading && (
                        <div className="text-center mt-4">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="text-sm font-medium px-5 py-2.5 rounded-lg border disabled:opacity-50"
                                style={{ borderColor: "var(--border-color)", color: "var(--color-primary)" }}
                            >
                                {loadingMore ? "Cargando..." : "Cargar más"}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {!isSuperadmin && <EduBot />}
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
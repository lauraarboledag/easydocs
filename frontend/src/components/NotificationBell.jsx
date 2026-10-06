import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Bell, CheckCheck, X, Trash2, ArrowRight } from "lucide-react";
import {
  getNotificationMeta,
  timeAgo,
  NOTIFICATIONS_CHANGED,
  emitNotificationsChanged,
} from "../utils/notificationMeta";

const PREVIEW_LIMIT = 8;

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch {
      // silencioso
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications/", { params: { limit: PREVIEW_LIMIT } });
      setNotifications(res.data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // cada minuto
    // Si la página de notificaciones cambia algo, se actualiza el contador
    window.addEventListener(NOTIFICATIONS_CHANGED, fetchUnreadCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_CHANGED, fetchUnreadCount);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!open) fetchNotifications();
    setOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silencioso
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      emitNotificationsChanged();
    } catch {
      // silencioso
    }
  };

  const handleDelete = async (e, n) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${n.id}`);
      setNotifications((prev) => prev.filter((x) => x.id !== n.id));
      if (!n.is_read) setUnreadCount((prev) => Math.max(0, prev - 1));
      emitNotificationsChanged();
    } catch {
      // silencioso
    }
  };

  const handleOpenItem = (n, path) => {
    if (!n.is_read) handleMarkAsRead(n.id);
    if (path) {
      setOpen(false);
      navigate(path);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg transition-colors"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--bg-primary)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
            style={{ backgroundColor: "#dc2626" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          // Celular: panel fijo de borde a borde bajo el encabezado.
          // Escritorio: desplegable de 384px junto a la campana.
          className="fixed inset-x-3 top-[4.5rem] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl border shadow-xl z-50 overflow-hidden flex flex-col max-h-[75vh] sm:max-h-[32rem]"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          <div
            className="flex items-center justify-between gap-2 px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: "var(--border-color)" }}
          >
            <p
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--text-secondary)" }}>
                  ({unreadCount} sin leer)
                </span>
              )}
            </p>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs hover:underline whitespace-nowrap"
                  style={{ color: "var(--color-primary)" }}
                >
                  <CheckCheck size={12} /> Marcar todas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ color: "var(--text-secondary)" }}
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div
                className="text-center py-8 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell
                  size={24}
                  className="mx-auto mb-2 opacity-30"
                  style={{ color: "var(--text-secondary)" }}
                />
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Sin notificaciones
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = getNotificationMeta(n, isSuperadmin);
                const Icon = meta.icon;
                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenItem(n, meta.path)}
                    onKeyDown={(e) => e.key === "Enter" && handleOpenItem(n, meta.path)}
                    className="group w-full text-left px-4 py-3 border-b last:border-0 transition-colors flex items-start gap-3 cursor-pointer"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: n.is_read
                        ? "transparent"
                        : "var(--color-primary-light)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: n.is_read ? "var(--bg-primary)" : meta.bg,
                      }}
                    >
                      <Icon
                        size={14}
                        style={{
                          color: n.is_read ? "var(--text-secondary)" : meta.color,
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs truncate ${n.is_read ? "font-medium" : "font-semibold"}`}
                        style={{ color: "var(--text-primary)" }}
                      >
                        {n.title}
                      </p>
                      {n.message && (
                        <p
                          className="text-xs mt-0.5 line-clamp-2"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {n.message}
                        </p>
                      )}
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      {!n.is_read && (
                        <div
                          className="w-2 h-2 rounded-full mt-1.5"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        />
                      )}
                      {/* En celular siempre visible; en escritorio al pasar el mouse */}
                      <button
                        onClick={(e) => handleDelete(e, n)}
                        className="p-1 rounded-md sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-50"
                        style={{ color: "#dc2626" }}
                        title="Eliminar notificación"
                        aria-label="Eliminar notificación"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              navigate(isSuperadmin ? "/admin/notificaciones" : "/notificaciones");
            }}
            className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-t flex-shrink-0"
            style={{ borderColor: "var(--border-color)", color: "var(--color-primary)" }}
          >
            Ver todas las notificaciones <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
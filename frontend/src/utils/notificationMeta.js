import {
    Bell,
    Calendar,
    FileText,
    CreditCard,
    Crown,
    AlertTriangle,
} from "lucide-react";

// Ícono, color y destino de cada notificación según su contenido.
// (Las notificaciones no guardan un "tipo"; se deduce del título.)
export function getNotificationMeta(n, isSuperadmin = false) {
    const title = (n.title || "").toLowerCase();

    if (n.calendar_event_id) {
        return { icon: Calendar, color: "#dc2626", bg: "#fee2e2", path: "/calendario" };
    }
    if (title.includes("límite")) {
        return {
            icon: AlertTriangle,
            color: "#b45309",
            bg: "#fef3c7",
            path: isSuperadmin ? null : "/suscripcion",
        };
    }
    if (title.includes("transacción") || title.includes("venta") || title.includes("pago")) {
        return { icon: CreditCard, color: "#16a34a", bg: "#f0fdf4", path: null };
    }
    if (title.includes("plan")) {
        return {
            icon: Crown,
            color: "#9333ea",
            bg: "#faf5ff",
            path: isSuperadmin ? null : "/suscripcion",
        };
    }
    if (title.includes("documento")) {
        return {
            icon: FileText,
            color: "var(--color-primary)",
            bg: "var(--color-primary-light)",
            path: isSuperadmin ? null : "/documentos",
        };
    }
    return { icon: Bell, color: "var(--text-secondary)", bg: "var(--bg-primary)", path: null };
}

export function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return "hace un momento";
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 86400 * 30) return `hace ${Math.floor(diff / 86400)} d`;
    return new Date(dateStr).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// Aviso entre la campana y la página de notificaciones para refrescar el contador
export const NOTIFICATIONS_CHANGED = "notifications:changed";
export const emitNotificationsChanged = () =>
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
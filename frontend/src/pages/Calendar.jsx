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
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  CheckCircle,
  Trash2,
  X,
  Calendar,
  Clock,
  AlignLeft,
} from "lucide-react";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const COLOR_OPTIONS = [
  { id: "blue", bg: "#dbeafe", dot: "#2952cc", label: "Azul" },
  { id: "green", bg: "#dcfce7", dot: "#16a34a", label: "Verde" },
  { id: "red", bg: "#fee2e2", dot: "#dc2626", label: "Rojo" },
  { id: "yellow", bg: "#fef9c3", dot: "#b45309", label: "Amarillo" },
  { id: "purple", bg: "#f3e8ff", dot: "#9333ea", label: "Morado" },
];

function getColor(colorId) {
  return COLOR_OPTIONS.find((c) => c.id === colorId) || COLOR_OPTIONS[0];
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    color: "blue",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

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
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/calendar/");
      setEvents(res.data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  const eventsForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.event_date.startsWith(dateStr));
  };

  const eventsForSelected = selectedDate ? eventsForDate(selectedDate) : [];

  const openNewEvent = (day) => {
    setSelectedDate(day);
    setEditingEvent(null);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T08:00`;
    setForm({ title: "", description: "", event_date: dateStr, color: "blue" });
    setShowModal(true);
  };

  const openEditEvent = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date.slice(0, 16),
      color: event.color,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingEvent) {
        await api.patch(`/calendar/${editingEvent.id}`, {
          title: form.title,
          description: form.description || null,
          event_date: new Date(form.event_date).toISOString(),
          color: form.color,
        });
      } else {
        await api.post("/calendar/", {
          title: form.title,
          description: form.description || null,
          event_date: new Date(form.event_date).toISOString(),
          color: form.color,
          type: "manual",
        });
      }
      await fetchEvents();
      setShowModal(false);
    } catch {
      // silencioso
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDone = async (event) => {
    try {
      await api.patch(`/calendar/${event.id}`, { is_done: !event.is_done });
      await fetchEvents();
    } catch {
      // silencioso
    }
  };

  const handleDelete = async (eventId) => {
    setDeleting(eventId);
    try {
      await api.delete(`/calendar/${eventId}`);
      await fetchEvents();
    } catch {
      // silencioso
    } finally {
      setDeleting(null);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Eventos próximos (hoy en adelante)
  const upcomingEvents = events
    .filter((e) => e.event_date >= todayStr && !e.is_done)
    .slice(0, 5);

  const pendingTodos = events.filter((e) => !e.is_done).length;

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
                Calendario
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {pendingTodos} tarea{pendingTodos !== 1 ? "s" : ""} pendiente
                {pendingTodos !== 1 ? "s" : ""}
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

        <div className="flex-1 p-8 flex gap-6">
          {/* Calendario */}
          <div className="flex-1">
            {/* Navegación mes */}
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg border transition-colors"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => {
                    setCurrentMonth(today.getMonth());
                    setCurrentYear(today.getFullYear());
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Hoy
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg border transition-colors"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Grid del calendario */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              {/* Cabecera días */}
              <div
                className="grid grid-cols-7 border-b"
                style={{ borderColor: "var(--border-color)" }}
              >
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="py-3 text-center text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Celdas */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="h-24 border-r border-b"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                    }}
                  />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isToday = dateStr === todayStr;
                  const isSelected = selectedDate === day;
                  const dayEvents = eventsForDate(day);

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className="h-24 border-r border-b p-2 cursor-pointer transition-colors relative"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: isSelected
                          ? "var(--color-primary-light)"
                          : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-primary)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "text-white" : ""}`}
                          style={{
                            backgroundColor: isToday
                              ? "var(--color-primary)"
                              : "transparent",
                            color: isToday ? "white" : "var(--text-primary)",
                          }}
                        >
                          {day}
                        </span>
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openNewEvent(day);
                            }}
                            className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "var(--color-primary)" }}
                          >
                            <Plus size={10} className="text-white" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => {
                          const col = getColor(ev.color);
                          return (
                            <div
                              key={ev.id}
                              className="text-xs px-1.5 py-0.5 rounded truncate"
                              style={{
                                backgroundColor: col.bg,
                                color: col.dot,
                              }}
                            >
                              {ev.is_done ? "✓ " : ""}
                              {ev.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            +{dayEvents.length - 2} más
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel lateral */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* Eventos del día seleccionado */}
            {selectedDate && (
              <div
                className="rounded-xl border p-5"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="font-semibold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedDate} de {MONTHS[currentMonth]}
                  </h3>
                  <button
                    onClick={() => openNewEvent(selectedDate)}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    <Plus size={12} /> Añadir
                  </button>
                </div>

                {eventsForSelected.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar
                      size={24}
                      className="mx-auto mb-2 opacity-30"
                      style={{ color: "var(--text-secondary)" }}
                    />
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Sin eventos este día
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventsForSelected.map((ev) => {
                      const col = getColor(ev.color);
                      return (
                        <div
                          key={ev.id}
                          className="flex items-start gap-2 p-3 rounded-lg"
                          style={{ backgroundColor: col.bg }}
                        >
                          <button
                            onClick={() => handleToggleDone(ev)}
                            className="flex-shrink-0 mt-0.5"
                          >
                            <div
                              className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                              style={{
                                borderColor: col.dot,
                                backgroundColor: ev.is_done
                                  ? col.dot
                                  : "transparent",
                              }}
                            >
                              {ev.is_done && (
                                <CheckCircle size={10} className="text-white" />
                              )}
                            </div>
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-medium ${ev.is_done ? "line-through opacity-50" : ""}`}
                              style={{ color: col.dot }}
                            >
                              {ev.title}
                            </p>
                            {ev.description && (
                              <p
                                className="text-xs mt-0.5 opacity-70"
                                style={{ color: col.dot }}
                              >
                                {ev.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditEvent(ev)}
                              className="opacity-50 hover:opacity-100 transition-opacity"
                              style={{ color: col.dot }}
                            >
                              <AlignLeft size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(ev.id)}
                              disabled={deleting === ev.id}
                              className="opacity-50 hover:opacity-100 transition-opacity"
                              style={{ color: col.dot }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Próximos eventos */}
            <div
              className="rounded-xl border p-5"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <h3
                className="font-semibold text-sm mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Próximos eventos
              </h3>
              {loading ? (
                <p
                  className="text-xs text-center py-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cargando...
                </p>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-6">
                  <Clock
                    size={24}
                    className="mx-auto mb-2 opacity-30"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Sin eventos próximos
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((ev) => {
                    const col = getColor(ev.color);
                    const date = new Date(ev.event_date);
                    return (
                      <div key={ev.id} className="flex items-start gap-3">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: col.dot }}
                        />
                        <div>
                          <p
                            className="text-xs font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {ev.title}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {date.toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Leyenda colores */}
            <div
              className="rounded-xl border p-5"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <h3
                className="font-semibold text-sm mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Categorías
              </h3>
              <div className="space-y-2">
                {COLOR_OPTIONS.map((col) => (
                  <div key={col.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: col.dot }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {col.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <EduBot />

      {/* Modal crear/editar evento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3
                className="font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {editingEvent ? "Editar evento" : "Nuevo evento"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Título *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Nombre del evento"
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Detalles opcionales..."
                  rows={2}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Fecha y hora *
                </label>
                <input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, event_date: e.target.value }))
                  }
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Color
                </label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => setForm((p) => ({ ...p, color: col.id }))}
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: col.dot,
                        borderColor:
                          form.color === col.id
                            ? "var(--text-primary)"
                            : "transparent",
                        transform:
                          form.color === col.id ? "scale(1.2)" : "scale(1)",
                      }}
                      title={col.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg border"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white disabled:opacity-40"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {saving
                  ? "Guardando..."
                  : editingEvent
                    ? "Guardar"
                    : "Crear evento"}
              </button>
            </div>
          </div>
        </div>
      )}

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

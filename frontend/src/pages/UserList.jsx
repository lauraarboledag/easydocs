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
  Users,
  Plus,
  Bell,
  ChevronLeft,
  UserCheck,
  Shield,
  BookOpen,
  ClipboardCheck,
  X,
  Eye,
  EyeOff,
  UserCircle,
} from "lucide-react";

const ROLE_CONFIG = {
  representative: {
    label: "Representante",
    icon: Shield,
    bg: "var(--color-primary-light)",
    color: "var(--color-primary)",
  },
  teacher: {
    label: "Docente",
    icon: BookOpen,
    bg: "#f0fdf4",
    color: "#16a34a",
  },
  secretary: {
    label: "Secretaría",
    icon: ClipboardCheck,
    bg: "#faf5ff",
    color: "#9333ea",
  },
};

export default function UserList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "teacher",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useInactivity({
    timeout: 30,
    onWarning: () => setShowInactivity(true),
    onLogout: () => {
      setShowInactivity(false);
      logout();
      navigate("/");
    },
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/");
      // Ordenar alfabéticamente por nombre
      const sorted = [...res.data].sort((a, b) =>
        a.full_name.localeCompare(b.full_name, "es"),
      );
      setUsers(sorted);
    } catch (err) {
      setError("Error al cargar usuarios. Intenta de nuevo más tarde")
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    setCreating(true);
    try {
      await api.post("/users/", {
        ...form,
        institution_id: user.institution_id,
      });
      setSuccess(`Usuario ${form.full_name} creado exitosamente.`);
      setForm({ full_name: "", email: "", password: "", role: "teacher" });
      setShowModal(false);
      fetchUsers();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al crear el usuario.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="ml-56 flex-1 flex flex-col">
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
                Usuarios
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Equipo institucional
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
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <UserCheck size={16} /> {success}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Equipo institucional
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {users.length} usuario{users.length !== 1 ? "s" : ""} —
                ordenados alfabéticamente
              </p>
            </div>
            {user?.role === "representative" && (
              <button
                onClick={() => setShowModal(true)}
                className="text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Plus size={18} /> Nuevo usuario
              </button>
            )}
          </div>

          {/* Resumen por roles */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Object.entries(ROLE_CONFIG).map(([role, config]) => {
              const count = users.filter((u) => u.role === role).length;
              const Icon = config.icon;
              return (
                <div
                  key={role}
                  className="rounded-xl border p-4 flex items-center gap-4"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: config.bg }}
                  >
                    <Icon size={18} style={{ color: config.color }} />
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
                      {config.label}
                      {count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lista */}
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
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Cargando usuarios...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  <Users
                    size={32}
                    style={{ color: "var(--text-secondary)", opacity: 0.4 }}
                  />
                </div>
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Sin usuarios aún
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Agrega docentes y secretaría a tu institución
                </p>
                {user?.role === "representative" && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 text-sm font-medium hover:underline"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Agregar usuario →
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
                  <span className="col-span-5">Usuario</span>
                  <span className="col-span-3">Rol</span>
                  <span className="col-span-2">Estado</span>
                  <span className="col-span-2">Miembro desde</span>
                </div>
                {users.map((u) => {
                  const roleConfig = ROLE_CONFIG[u.role] || ROLE_CONFIG.teacher;
                  const RoleIcon = roleConfig.icon;
                  return (
                    <div
                      key={u.id}
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
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: "var(--color-primary-light)",
                          }}
                        >
                          <UserCircle
                            size={22}
                            style={{ color: "var(--color-icon)" }}
                          />
                        </div>
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {u.full_name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: roleConfig.bg,
                            color: roleConfig.color,
                          }}
                        >
                          <RoleIcon size={11} />
                          {roleConfig.label}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: u.is_active
                              ? "#f0fdf4"
                              : "var(--bg-primary)",
                            color: u.is_active
                              ? "#16a34a"
                              : "var(--text-secondary)",
                          }}
                        >
                          {u.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {new Date(u.created_at).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl w-full max-w-md"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <h3
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Nuevo usuario
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Nombre completo *
                </label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Ej: María García López"
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
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
                  Correo electrónico *
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@institucion.edu.co"
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
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
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 pr-10"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Rol *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "teacher", label: "Docente", icon: BookOpen },
                    {
                      value: "secretary",
                      label: "Secretaría",
                      icon: ClipboardCheck,
                    },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, role: value })}
                      className="flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors"
                      style={{
                        backgroundColor:
                          form.role === value
                            ? "var(--color-primary)"
                            : "var(--bg-secondary)",
                        color:
                          form.role === value
                            ? "#ffffff"
                            : "var(--text-secondary)",
                        borderColor:
                          form.role === value
                            ? "var(--color-primary)"
                            : "var(--border-color)",
                      }}
                    >
                      <Icon size={16} /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                  className="flex-1 border font-medium py-3 rounded-lg transition-colors"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {creating ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

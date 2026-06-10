import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import {
  Users,
  Plus,
  FileText,
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  MessageSquare,
  UserCheck,
  Shield,
  BookOpen,
  ClipboardCheck,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Documentos", icon: FileText, path: "/documentos" },
  { label: "Usuarios", icon: Users, path: "/usuarios" },
  { label: "Estudiantes", icon: GraduationCap, path: "/estudiantes" },
  { label: "Matrículas", icon: ClipboardList, path: "/matriculas" },
  { label: "Suscripción", icon: CreditCard, path: "/suscripcion" },
];

const ROLE_CONFIG = {
  representative: {
    label: "Representante",
    icon: Shield,
    style: "bg-blue-100 text-blue-700",
  },
  teacher: {
    label: "Docente",
    icon: BookOpen,
    style: "bg-green-100 text-green-700",
  },
  secretary: {
    label: "Secretaría",
    icon: ClipboardCheck,
    style: "bg-purple-100 text-purple-700",
  },
};

export default function UserList() {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "teacher",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
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

  const handleLogout = () => setShowLogout(true);
  const confirmLogout = () => {
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
            <h1 className="text-lg font-semibold text-gray-800">Usuarios</h1>
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
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <UserCheck size={16} />
              {success}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Equipo institucional
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {users.length} usuario{users.length !== 1 ? "s" : ""} registrado
                {users.length !== 1 ? "s" : ""}
              </p>
            </div>
            {user?.role === "representative" && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Nuevo usuario
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
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.style}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-400">
                      {config.label}
                      {count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lista de usuarios */}
          <div className="bg-white rounded-xl border border-gray-100">
            {loading ? (
              <div className="text-center py-16 text-gray-400">
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Cargando usuarios...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Sin usuarios aún</p>
                <p className="text-gray-400 text-sm mt-1">
                  Agrega docentes y secretaría a tu institución
                </p>
                {user?.role === "representative" && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 text-sm text-[#2952cc] font-medium hover:underline"
                  >
                    Agregar usuario →
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-12 text-xs text-gray-400 uppercase tracking-wide px-6 py-3 border-b border-gray-50">
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
                      className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#2952cc] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">
                            {u.full_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {u.full_name}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${roleConfig.style}`}
                        >
                          <RoleIcon size={11} />
                          {roleConfig.label}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                            u.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {u.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400">
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

      {/* Modal crear usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Nuevo usuario</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Nombre completo *
                </label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Ej: María García López"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Correo electrónico *
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@institucion.edu.co"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
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
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        form.role === value
                          ? "bg-[#2952cc] text-white border-[#2952cc]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon size={16} />
                      {label}
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
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {creating ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

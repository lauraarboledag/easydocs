import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  GraduationCap,
  ClipboardList,
  CreditCard,
  Settings,
  LogOut,
  BookOpen,
  CalendarDays,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Documentos", icon: FileText, path: "/documentos" },
  { label: "Usuarios", icon: Users, path: "/usuarios" },
  { label: "Estudiantes", icon: GraduationCap, path: "/estudiantes" },
  { label: "Programas", icon: BookOpen, path: "/programas" },
  { label: "Matrículas", icon: ClipboardList, path: "/matriculas" },
  { label: "Calendario", icon: CalendarDays, path: "/calendario" },
  { label: "Suscripción", icon: CreditCard, path: "/suscripcion" },
];

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className="w-56 flex flex-col fixed h-full"
      style={{ backgroundColor: "var(--color-sidebar)" }}
    >
      <div
        className="p-6 border-b"
        style={{ borderColor: "var(--color-sidebar-hover)" }}
      >
        <div className="flex items-center gap-2">
          <img
            src="/logo_easydocs_blanco.png"
            alt="EasyDocs"
            className="h-16 w-auto object-contain"
          />
          <div>
            <p className="text-blue-300 text-xs">Gestión Institucional</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-blue-200 hover:text-white"
            style={{
              backgroundColor:
                location.pathname === path
                  ? "var(--color-sidebar-hover)"
                  : "transparent",
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== path)
                e.currentTarget.style.backgroundColor =
                  "var(--color-sidebar-hover)";
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== path)
                e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div
        className="p-6 border-b"
        style={{ borderColor: "var(--color-sidebar-hover)" }}
      >
        <button
          onClick={() => navigate("/configuracion")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-blue-200 hover:text-white hover:bg-white/10"
        >
          <Settings size={16} /> Configuración
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-blue-200 hover:text-white hover:bg-red-500/20"
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

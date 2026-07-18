import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  FileText,
  CreditCard,
  ArrowLeftRight,
  Settings,
  LogOut,
  CalendarDays
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Instituciones", icon: Building2, path: "/admin/instituciones" },
  { label: "Plantillas", icon: FileText, path: "/admin/plantillas" },
  { label: "Planes", icon: CreditCard, path: "/admin/planes" },
  {
    label: "Transacciones",
    icon: ArrowLeftRight,
    path: "/admin/transacciones",
  },
  { label: "Calendario", icon: CalendarDays, path: "/admin/calendario" },
];

export default function AdminSidebar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className="w-56 flex flex-col fixed h-full"
      style={{ backgroundColor: "var(--color-sidebar)" }}
    >
      <div
        className="p-4 border-t space-y-1"
        style={{ borderColor: "var(--color-sidebar-hover)" }}
      >
        <div className="flex items-center gap-2">
          <img
            src="/logo_easydocs_blanco.png"
            alt="EasyDocs"
            className="h-16 w-auto object-contain"
          />
          <div>
            <p className="text-yellow-300 text-xs font-medium">Panel Admin</p>
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
        className="p-4 border-t space-y-1"
        style={{ borderColor: "var(--color-sidebar-hover)" }}
      >
        <button
          onClick={() => navigate("/admin/configuracion")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Settings size={16} /> Configuración
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:text-white hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

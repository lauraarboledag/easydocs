import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  FileText,
  CreditCard,
  ArrowLeftRight,
  Settings,
  LogOut,
  CalendarDays,
  Menu,
  X,
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
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false); // cierra el drawer al elegir una opción en móvil
  };

  return (
    <>
      {/* Botón hamburguesa — solo visible en móvil */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg"
        style={{ backgroundColor: "var(--color-sidebar)" }}
      >
        <Menu size={20} className="text-white" />
      </button>

      {/* Fondo oscuro detrás del drawer — solo en móvil, cuando está abierto */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`w-56 flex flex-col fixed top-0 left-0 h-full overflow-y-auto z-50 transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
        style={{ backgroundColor: "var(--color-sidebar)" }}
      >
        <div
          className="p-4 border-t space-y-1"
          style={{ borderColor: "var(--color-sidebar-hover)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img
                src="/logo_easydocs_blanco.png"
                alt="EasyDocs"
                className="h-16 w-auto object-contain"
              />
              <div>
                <p className="text-yellow-300 text-xs font-medium">
                  Panel Admin
                </p>
              </div>
            </div>
            {/* Botón cerrar — solo visible en móvil, dentro del drawer abierto */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 text-blue-200 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => handleNavigate(path)}
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
            onClick={() => handleNavigate("/admin/configuracion")}
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
    </>
  );
}
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Documentos", icon: FileText, path: "/documentos" },
  { label: "Usuarios", icon: Users, path: "/usuarios" },
  { label: "Estudiantes", icon: GraduationCap, path: "/estudiantes" },
  { label: "Programas", icon: BookOpen, path: "/programas" },
  { label: "Matrículas", icon: ClipboardList, path: "/matriculas" },
  { label: "Suscripción", icon: CreditCard, path: "/suscripcion" },
];

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();

  return (
    <aside className="w-56 bg-[#1a2b4a] flex flex-col fixed h-full">
      <div className="p-6 border-b border-blue-900">
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
        <button
          onClick={() => navigate("/configuracion")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
        >
          <Settings size={16} /> Configuración
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-red-800 hover:text-white transition-colors"
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

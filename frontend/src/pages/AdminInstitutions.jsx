import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import {
  Building2,
  LayoutDashboard,
  FileText,
  CreditCard,
  ArrowLeftRight,
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  Search,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Hash,
  Shield,
  MessageSquare,
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
];

export default function AdminInstitutions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    api.get("/institutions/").then((res) => {
      setInstitutions(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = institutions.filter(
    (inst) =>
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.municipality.toLowerCase().includes(search.toLowerCase()) ||
      inst.dane_code.includes(search),
  );

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
              <p className="text-yellow-300 text-xs font-medium">Panel Admin</p>
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
              onClick={() => navigate("/admin")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Instituciones
              </h1>
              <p className="text-xs text-gray-400">
                Gestión global de instituciones registradas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
              <p className="text-sm font-medium text-gray-800">
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 flex gap-6">
          {/* Lista */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {institutions.length} institución
                  {institutions.length !== 1 ? "es" : ""} registrada
                  {institutions.length !== 1 ? "s" : ""}
                </h2>
              </div>
            </div>

            {/* Buscador */}
            <div className="relative mb-4">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, municipio o código DANE..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
              />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-gray-100">
              {loading ? (
                <div className="text-center py-16 text-gray-400">
                  <Building2 size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Cargando instituciones...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Building2 size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Sin resultados</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-12 text-xs text-gray-400 uppercase tracking-wide px-6 py-3 border-b border-gray-50">
                    <span className="col-span-4">Institución</span>
                    <span className="col-span-3">Ubicación</span>
                    <span className="col-span-2">Código DANE</span>
                    <span className="col-span-2">Estado</span>
                    <span className="col-span-1">Ver</span>
                  </div>
                  {filtered.map((inst) => (
                    <div
                      key={inst.id}
                      className={`grid grid-cols-12 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${selected?.id === inst.id ? "bg-blue-50" : ""}`}
                      onClick={() => setSelected(inst)}
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 size={16} className="text-[#2952cc]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-40">
                            {inst.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {inst.education_level
                              ?.split(" ")
                              .slice(0, 2)
                              .join(" ")}
                            ...
                          </p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p className="text-sm text-gray-600">
                          {inst.municipality}
                        </p>
                        <p className="text-xs text-gray-400">
                          {inst.department}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-mono text-gray-500">
                          {inst.dane_code}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                            inst.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {inst.is_active ? (
                            <>
                              <CheckCircle size={11} /> Activa
                            </>
                          ) : (
                            <>
                              <XCircle size={11} /> Inactiva
                            </>
                          )}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(inst);
                          }}
                          className="text-xs text-[#2952cc] hover:underline font-medium"
                        >
                          Detalles
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Panel de detalle */}
          {selected && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-gray-800">Detalle</h3>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle size={16} />
                  </button>
                </div>

                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Building2 size={24} className="text-[#2952cc]" />
                </div>

                <h4 className="font-bold text-gray-900 mb-1">
                  {selected.name}
                </h4>
                <p className="text-xs text-gray-400 mb-5">
                  {selected.education_level}
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={14}
                      className="text-gray-400 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs text-gray-400">Ubicación</p>
                      <p className="text-sm text-gray-700">
                        {selected.municipality}, {selected.department}
                      </p>
                      {selected.address && (
                        <p className="text-xs text-gray-400">
                          {selected.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Hash
                      size={14}
                      className="text-gray-400 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs text-gray-400">Código DANE</p>
                      <p className="text-sm font-mono text-gray-700">
                        {selected.dane_code}
                      </p>
                    </div>
                  </div>

                  {selected.license_number && (
                    <div className="flex items-start gap-3">
                      <Shield
                        size={14}
                        className="text-gray-400 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-xs text-gray-400">Licencia</p>
                        <p className="text-sm text-gray-700">
                          {selected.license_number}
                        </p>
                      </div>
                    </div>
                  )}

                  {selected.phone && (
                    <div className="flex items-start gap-3">
                      <Phone
                        size={14}
                        className="text-gray-400 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-xs text-gray-400">Teléfono</p>
                        <p className="text-sm text-gray-700">
                          {selected.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {selected.email && (
                    <div className="flex items-start gap-3">
                      <Mail
                        size={14}
                        className="text-gray-400 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-xs text-gray-400">Correo</p>
                        <p className="text-sm text-gray-700 break-all">
                          {selected.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Estado</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        selected.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {selected.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">Verificada</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        selected.is_verified
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {selected.is_verified ? "Sí" : "Pendiente"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-4">
                  Registrada el{" "}
                  {new Date(selected.created_at).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* EduBot */}
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

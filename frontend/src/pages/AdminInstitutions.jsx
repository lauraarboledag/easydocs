import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import AdminSidebar from "../components/layout/AdminSidebar";
import useInactivity from "../hooks/useInactivity";
import InactivityModal from "../components/InactivityModal";
import {
  Building2,
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
} from "lucide-react";

export default function AdminInstitutions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);

  useEffect(() => {
    api.get("/institutions/").then((res) => {
      setInstitutions(res.data);
      setLoading(false);
    });
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

  const filtered = institutions.filter(
    (inst) =>
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.municipality.toLowerCase().includes(search.toLowerCase()) ||
      inst.dane_code.includes(search),
  );

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <AdminSidebar onLogout={() => setShowLogout(true)} />

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
              onClick={() => navigate("/admin")}
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
                Instituciones
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Gestión global de instituciones registradas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2" style={{ color: "var(--text-secondary)" }}>
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Shield size={14} className="text-white" />
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
          {/* Lista */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {institutions.length} institución
                  {institutions.length !== 1 ? "es" : ""} registrada
                  {institutions.length !== 1 ? "s" : ""}
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {institutions.filter((i) => i.is_active).length} activas ·{" "}
                  {institutions.filter((i) => !i.is_active).length} inactivas
                </p>
              </div>
            </div>

            {/* Buscador */}
            <div className="relative mb-4">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-secondary)" }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre, municipio o código DANE..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Tabla */}
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
                  <Building2 size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Cargando instituciones...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Building2
                    size={32}
                    className="mx-auto mb-3"
                    style={{ color: "var(--text-secondary)", opacity: 0.4 }}
                  />
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Sin resultados
                  </p>
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
                    <span className="col-span-4">Institución</span>
                    <span className="col-span-3">Ubicación</span>
                    <span className="col-span-2">Código DANE</span>
                    <span className="col-span-2">Estado</span>
                    <span className="col-span-1">Ver</span>
                  </div>
                  {filtered.map((inst) => (
                    <div
                      key={inst.id}
                      className="grid grid-cols-12 items-center px-6 py-4 border-b last:border-0 transition-colors cursor-pointer"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor:
                          selected?.id === inst.id
                            ? "var(--color-primary-light)"
                            : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (selected?.id !== inst.id)
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-primary)";
                      }}
                      onMouseLeave={(e) => {
                        if (selected?.id !== inst.id)
                          e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      onClick={() => setSelected(inst)}
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: "var(--color-primary-light)",
                          }}
                        >
                          <Building2
                            size={16}
                            style={{ color: "var(--color-icon)" }}
                          />
                        </div>
                        <div>
                          <p
                            className="text-sm font-medium truncate max-w-40"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {inst.name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {inst.education_level
                              ?.split(" ")
                              .slice(0, 2)
                              .join(" ")}
                            ...
                          </p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {inst.municipality}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {inst.department}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p
                          className="text-xs font-mono"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {inst.dane_code}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: inst.is_active
                              ? "#f0fdf4"
                              : "#fee2e2",
                            color: inst.is_active ? "#16a34a" : "#dc2626",
                          }}
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
                          className="text-xs font-medium hover:underline"
                          style={{ color: "var(--color-primary)" }}
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

          {/* Panel detalle */}
          {selected && (
            <div className="w-80 flex-shrink-0">
              <div
                className="rounded-xl border p-6 sticky top-24"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Detalle
                  </h3>
                  <button
                    onClick={() => setSelected(null)}
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <XCircle size={16} />
                  </button>
                </div>

                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "var(--color-primary-light)" }}
                >
                  <Building2 size={24} style={{ color: "var(--color-icon)" }} />
                </div>

                <h4
                  className="font-bold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {selected.name}
                </h4>
                <p
                  className="text-xs mb-5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {selected.education_level}
                </p>

                <div className="space-y-3">
                  {[
                    {
                      icon: MapPin,
                      label: "Ubicación",
                      value: `${selected.municipality}, ${selected.department}`,
                      sub: selected.address,
                    },
                    {
                      icon: Hash,
                      label: "Código DANE",
                      value: selected.dane_code,
                      mono: true,
                    },
                    selected.license_number && {
                      icon: Shield,
                      label: "Licencia",
                      value: selected.license_number,
                    },
                    selected.phone && {
                      icon: Phone,
                      label: "Teléfono",
                      value: selected.phone,
                    },
                    selected.email && {
                      icon: Mail,
                      label: "Correo",
                      value: selected.email,
                      breakAll: true,
                    },
                  ]
                    .filter(Boolean)
                    .map(
                      ({ icon: Icon, label, value, sub, mono, breakAll }) => (
                        <div key={label} className="flex items-start gap-3">
                          <Icon
                            size={14}
                            className="flex-shrink-0 mt-0.5"
                            style={{ color: "var(--text-secondary)" }}
                          />
                          <div>
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {label}
                            </p>
                            <p
                              className={`text-sm ${mono ? "font-mono" : ""} ${breakAll ? "break-all" : ""}`}
                              style={{ color: "var(--text-primary)" }}
                            >
                              {value}
                            </p>
                            {sub && (
                              <p
                                className="text-xs"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                {sub}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                </div>

                <div
                  className="mt-5 pt-5 border-t space-y-2"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  {[
                    {
                      label: "Estado",
                      value: selected.is_active ? "Activa" : "Inactiva",
                      bg: selected.is_active ? "#f0fdf4" : "#fee2e2",
                      color: selected.is_active ? "#16a34a" : "#dc2626",
                    },
                    {
                      label: "Verificada",
                      value: selected.is_verified ? "Sí" : "Pendiente",
                      bg: selected.is_verified
                        ? "var(--color-primary-light)"
                        : "var(--bg-primary)",
                      color: selected.is_verified
                        ? "var(--color-primary)"
                        : "var(--text-secondary)",
                    },
                  ].map(({ label, value, bg, color }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between"
                    >
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {label}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ backgroundColor: bg, color }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <p
                  className="text-xs mt-4"
                  style={{ color: "var(--text-secondary)" }}
                >
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

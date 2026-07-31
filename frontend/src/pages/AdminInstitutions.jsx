import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AdminSidebar from "../components/layout/AdminSidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import {
  Bell,
  ChevronLeft,
  Building2,
  CheckCircle,
  XCircle,
  MapPin,
  Hash,
  Shield,
  Phone,
  Mail,
  Search,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";

function InstitutionRow({ inst, isSelected, onSelect, onDelete }) {
  return (
    <div
      className="grid grid-cols-12 items-center px-6 py-4 border-b last:border-0 transition-colors cursor-pointer"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: isSelected
          ? "var(--color-primary-light)"
          : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected)
          e.currentTarget.style.backgroundColor = "var(--bg-primary)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
      }}
      onClick={() => onSelect(inst)}
    >
      <div className="col-span-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--color-primary-light)" }}
        >
          <Building2 size={18} style={{ color: "var(--color-icon)" }} />
        </div>
        <div>
          <p
            className="text-sm font-semibold truncate max-w-48"
            style={{ color: "var(--text-primary)" }}
          >
            {inst.name}
          </p>
          <p
            className="text-xs truncate max-w-48"
            style={{ color: "var(--text-secondary)" }}
          >
            {inst.education_level?.split(" ").slice(0, 3).join(" ")}...
          </p>
        </div>
      </div>
      <div className="col-span-3">
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>
          {inst.municipality}
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
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
            backgroundColor: inst.is_active ? "#f0fdf4" : "#fee2e2",
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
      <div className="col-span-1 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(inst);
          }}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#dc2626";
            e.currentTarget.style.backgroundColor = "#fee2e2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Eliminar institución"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function InstitutionDetailPanel({ selected, onClose, onDelete }) {
  const fields = [
    {
      icon: MapPin,
      label: "Ubicación",
      value: `${selected.municipality}, ${selected.department}`,
      sub: selected.address,
    },
    { icon: Hash, label: "Código DANE", value: selected.dane_code, mono: true },
    selected.license_number && {
      icon: Shield,
      label: "Licencia",
      value: selected.license_number,
    },
    selected.phone && { icon: Phone, label: "Teléfono", value: selected.phone },
    selected.email && {
      icon: Mail,
      label: "Correo",
      value: selected.email,
      breakAll: true,
    },
  ].filter(Boolean);

  const badges = [
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
  ];

  return (
    <div className="w-80 flex-shrink-0">
      <div
        className="rounded-2xl border p-6 sticky top-24"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
            Detalle
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--color-primary-light)" }}
        >
          <Building2 size={24} style={{ color: "var(--color-icon)" }} />
        </div>

        <h4 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          {selected.name}
        </h4>
        <p className="text-xs mb-5" style={{ color: "var(--text-secondary)" }}>
          {selected.education_level}
        </p>

        <div className="space-y-3">
          {fields.map(({ icon: Icon, label, value, sub, mono, breakAll }) => (
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
          ))}
        </div>

        <div
          className="mt-5 pt-5 border-t space-y-2"
          style={{ borderColor: "var(--border-color)" }}
        >
          {badges.map(({ label, value, bg, color }) => (
            <div key={label} className="flex items-center justify-between">
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

        <p className="text-xs mt-4" style={{ color: "var(--text-secondary)" }}>
          Registrada el{" "}
          {new Date(selected.created_at).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>

        <button
          onClick={() => onDelete(selected)}
          className="w-full mt-5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
        >
          <Trash2 size={14} /> Eliminar institución
        </button>
      </div>
    </div>
  );
}

function DeleteInstitutionModal({
  institution,
  onConfirm,
  onClose,
  deleting,
  error,
}) {
  const [confirmText, setConfirmText] = useState("");
  const isValid = confirmText.trim() === institution.name.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl shadow-xl w-full max-w-md"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="p-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-red-50">
            <AlertTriangle size={26} className="text-red-600" />
          </div>
          <h3
            className="text-lg font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Eliminar institución
          </h3>
          <p
            className="text-sm mb-4 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Esta acción eliminará permanentemente{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {institution.name}
            </strong>
            , incluyendo todos sus usuarios, documentos, estudiantes, matrículas
            y suscripciones. Esta acción no se puede deshacer.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <label
            className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Escribe el nombre de la institución para confirmar
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={institution.name}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-5"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
            }}
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 py-3 rounded-xl text-sm font-medium border transition-colors"
              style={{
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={!isValid || deleting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition-colors"
            >
              {deleting ? "Eliminando..." : "Eliminar definitivamente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminInstitutions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const res = await api.get("/institutions/");
      setInstitutions(res.data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/institutions/${deleteTarget.id}`);
      setInstitutions((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err.response?.data?.detail || "Error al eliminar la institución.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const filtered = institutions.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.municipality?.toLowerCase().includes(search.toLowerCase()) ||
      i.dane_code?.includes(search),
  );

  const activeCount = institutions.filter((i) => i.is_active).length;

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
                {institutions.length} registradas — {activeCount} activas
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
          <div className="flex-1">
            <div className="relative mb-5">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-secondary)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, municipio o código DANE..."
                className="w-full border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div
              className="rounded-2xl border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              {loading ? (
                <div
                  className="text-center py-16 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cargando instituciones...
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Building2
                    size={32}
                    className="mx-auto mb-3 opacity-30"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Sin instituciones que coincidan
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
                    <span className="col-span-2">DANE</span>
                    <span className="col-span-2">Estado</span>
                    <span className="col-span-1"></span>
                  </div>
                  {filtered.map((inst) => (
                    <InstitutionRow
                      key={inst.id}
                      inst={inst}
                      isSelected={selected?.id === inst.id}
                      onSelect={setSelected}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {selected && (
            <InstitutionDetailPanel
              selected={selected}
              onClose={() => setSelected(null)}
              onDelete={setDeleteTarget}
            />
          )}
        </div>
      </main>

      {deleteTarget && (
        <DeleteInstitutionModal
          institution={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteError("");
          }}
          deleting={deleting}
          error={deleteError}
        />
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

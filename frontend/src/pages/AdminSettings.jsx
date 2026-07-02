import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import AdminSidebar from "../components/layout/AdminSidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import {
  Bell,
  ChevronLeft,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  User,
  Sun,
  Shield,
  UserPlus,
} from "lucide-react";

const TABS = [
  { id: "account", label: "Mi cuenta", icon: User },
  { id: "appearance", label: "Apariencia", icon: Sun },
  { id: "team", label: "Equipo", icon: UserPlus },
];

const PASSWORD_RULES = [
  { key: "length", label: "Mínimo 8 caracteres" },
  { key: "uppercase", label: "Al menos una mayúscula" },
  { key: "number", label: "Incluye números" },
  { key: "special", label: "Carácter especial (!@#$%^&*)" },
];

function PasswordField({ label, field, value, show, onChange, onToggle }) {
  return (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wide mb-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 pr-10"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-secondary)" }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function PasswordStrengthIndicator({ strength }) {
  return (
    <div className="space-y-2">
      {PASSWORD_RULES.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
            style={{
              backgroundColor: strength[key] ? "#22c55e" : "transparent",
              borderColor: strength[key] ? "#22c55e" : "var(--border-color)",
            }}
          >
            {strength[key] && <CheckCircle size={10} className="text-white" />}
          </div>
          <span
            className="text-xs"
            style={{
              color: strength[key] ? "#16a34a" : "var(--text-secondary)",
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function AppearanceTab({ theme, setTheme, themes }) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <h2 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        Apariencia
      </h2>
      <p className="text-xs mb-6" style={{ color: "var(--text-secondary)" }}>
        Elige el tema visual de tu panel de administración.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
            style={{
              borderColor:
                theme === t.id ? "var(--color-primary)" : "var(--border-color)",
              backgroundColor:
                theme === t.id ? "var(--color-primary-light)" : "transparent",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex-shrink-0 shadow-inner"
              style={{ backgroundColor: t.color }}
            />
            <div className="flex-1">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {t.label}
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {t.description}
              </p>
            </div>
            {theme === t.id && (
              <CheckCircle
                size={18}
                style={{ color: "var(--color-primary)" }}
                className="flex-shrink-0"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function TeamTab({ onSuccess, onError }) {
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [strength, setStrength] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (field === "password") {
      setStrength({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*]/.test(value),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Object.values(strength).every(Boolean)) {
      onError("La contraseña no cumple con todos los requisitos.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/superadmin", form);
      onSuccess(`Superadmin ${form.full_name} creado exitosamente.`);
      setForm({ full_name: "", email: "", password: "" });
      setStrength({
        length: false,
        uppercase: false,
        number: false,
        special: false,
      });
    } catch (err) {
      onError(err.response?.data?.detail || "Error al crear el superadmin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="rounded-xl border p-6"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "#fef9c3" }}
        >
          <Shield size={16} className="text-yellow-600" />
        </div>
        <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>
          Crear superadministrador
        </h2>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--text-secondary)" }}>
        Solo los superadmins pueden crear otros superadmins. Usa esta función
        con cuidado.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Nombre completo
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            placeholder="Nombre Apellido"
            required
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
            Correo electrónico
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="correo@easydocs.com"
            required
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
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Contraseña segura"
              required
              className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 pr-10"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-secondary)" }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {form.password && <PasswordStrengthIndicator strength={strength} />}

        <button
          type="submit"
          disabled={saving}
          className="font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <UserPlus size={16} />
          {saving ? "Creando..." : "Crear superadmin"}
        </button>
      </form>
    </div>
  );
}

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("account");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  useInactivity({
    timeout: 30,
    onWarning: () => setShowInactivity(true),
    onLogout: () => {
      setShowInactivity(false);
      logout();
      navigate("/");
    },
  });

  const handlePasswordChange = (field, value) => {
    setPasswords((p) => ({ ...p, [field]: value }));
    if (field === "new") {
      setPasswordStrength({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*]/.test(value),
      });
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!Object.values(passwordStrength).every(Boolean)) {
      setError("La contraseña no cumple con todos los requisitos.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/auth/change-password", {
        current_password: passwords.current,
        new_password: passwords.new,
      });
      setSuccess("Contraseña actualizada exitosamente.");
      setPasswords({ current: "", new: "", confirm: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  const passwordFieldLabels = {
    current: "Contraseña actual",
    new: "Nueva contraseña",
    confirm: "Confirmar contraseña",
  };

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
                Configuración
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Tu cuenta de superadministrador
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

        <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <CheckCircle size={16} /> {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div
            className="flex gap-1 rounded-xl p-1 mb-6 border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setError("");
                  setSuccess("");
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    activeTab === id ? "var(--color-primary)" : "transparent",
                  color: activeTab === id ? "#ffffff" : "var(--text-secondary)",
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {activeTab === "account" && (
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <h2
                className="font-bold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Cambiar contraseña
              </h2>
              <p
                className="text-xs mb-5"
                style={{ color: "var(--text-secondary)" }}
              >
                Usa una contraseña segura que no uses en otros sitios.
              </p>
              <form
                onSubmit={handleSavePassword}
                className="space-y-4 max-w-md"
              >
                {["current", "new", "confirm"].map((field) => (
                  <PasswordField
                    key={field}
                    field={field}
                    label={passwordFieldLabels[field]}
                    value={passwords[field]}
                    show={showPasswords[field]}
                    onChange={handlePasswordChange}
                    onToggle={() =>
                      setShowPasswords((p) => ({ ...p, [field]: !p[field] }))
                    }
                  />
                ))}
                {passwords.new && (
                  <PasswordStrengthIndicator strength={passwordStrength} />
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm text-white disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Save size={16} />
                  {saving ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "appearance" && (
            <AppearanceTab theme={theme} setTheme={setTheme} themes={themes} />
          )}

          {activeTab === "team" && (
            <TeamTab
              onSuccess={(msg) => {
                setSuccess(msg);
                setTimeout(() => setSuccess(""), 4000);
              }}
              onError={(msg) => setError(msg)}
            />
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

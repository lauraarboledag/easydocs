import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import NotificationBell from "../components/NotificationBell";
import {
  EDITABLE_INSTITUTION_FIELDS,
  validateInstitutionForm,
  isValidPhone,
  formatApiError,
} from "../utils/institutionFields";
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
  Mail,
  Shield,
  Building2,
  Lock,
  Droplets,
  Upload,
  Trash2,
  ImageIcon,
} from "lucide-react";


const TABS = [
  { id: "institution", label: "Institución", icon: Building2 },
  { id: "account", label: "Contraseña", icon: User },
  { id: "email", label: "Correo", icon: Mail },
  { id: "appearance", label: "Apariencia", icon: Sun },
];

const LOGO_POSITIONS = [
  { id: "top-left", label: "Izquierda" },
  { id: "top-center", label: "Centro" },
  { id: "top-right", label: "Derecha" },
];

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB, igual que el backend

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
        className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 pr-10 transition-all"
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
      className="rounded-2xl border p-4 md:p-6"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <h2 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        Apariencia
      </h2>
      <p className="text-xs mb-6" style={{ color: "var(--text-secondary)" }}>
        Elige el tema visual de tu panel.
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

function InstitutionTab({ onSuccess, onError }) {
  const [institution, setInstitution] = useState(null);
  const [form, setForm] = useState({});
  const [prefs, setPrefs] = useState({ logo_position: "top-left", logo_watermark: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fillForm = (data) => {
    setForm(
      Object.fromEntries(EDITABLE_INSTITUTION_FIELDS.map((f) => [f.key, data[f.key] || ""])),
    );
    setPrefs({
      logo_position: data.logo_position || "top-left",
      logo_watermark: !!data.logo_watermark,
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/institutions/my");
        setInstitution(res.data);
        fillForm(res.data);
      } catch (err) {
        onError(formatApiError(err, "No se pudieron cargar los datos de la institución."));
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      onError("Formato no permitido. Usa PNG, JPG, WEBP o SVG.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      onError("El logo no puede superar 2 MB.");
      return;
    }
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/institutions/my/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setInstitution((prev) => ({ ...prev, logo_url: res.data.logo_url }));
      onError("");
      onSuccess("Logo actualizado.");
    } catch (err) {
      onError(formatApiError(err, "No se pudo subir el logo."));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!confirm("¿Quitar el logo de la institución? Dejará de aparecer en tus documentos.")) return;
    setUploadingLogo(true);
    try {
      await api.delete("/institutions/my/logo");
      setInstitution((prev) => ({ ...prev, logo_url: null, logo_watermark: false }));
      setPrefs((p) => ({ ...p, logo_watermark: false }));
      onError("");
      onSuccess("Logo eliminado.");
    } catch (err) {
      onError(formatApiError(err, "No se pudo quitar el logo."));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const required = ["department", "municipality", "education_level"];
    const missing = EDITABLE_INSTITUTION_FIELDS.filter(
      (f) => required.includes(f.key) && !(form[f.key] || "").trim(),
    );
    if (missing.length) {
      onError(`Completa: ${missing.map((f) => f.label).join(", ")}.`);
      return;
    }
    const validation = validateInstitutionForm(form);
    if (validation) {
      onError(validation);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, (v || "").trim()])),
        ...prefs,
      };
      const res = await api.put("/institutions/my", payload);
      setInstitution(res.data);
      fillForm(res.data);
      onError("");
      onSuccess("Datos de la institución actualizados.");
    } catch (err) {
      onError(formatApiError(err, "No se pudieron guardar los datos de la institución."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm py-10 text-center" style={{ color: "var(--text-secondary)" }}>
        Cargando...
      </div>
    );
  }
  if (!institution) return null;

  const legal = [
    { label: "Nombre", value: institution.name },
    { label: "Licencia de funcionamiento", value: institution.license_number },
    { label: "Código DANE", value: institution.dane_code },
  ];

  return (
    <div
      className="rounded-2xl border p-4 md:p-6"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <h2 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        Datos de la institución
      </h2>
      <p className="text-xs mb-5" style={{ color: "var(--text-secondary)" }}>
        Aparecen en el encabezado y el contenido de tus documentos.
      </p>

      <div
        className="rounded-xl p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        {legal.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1"
              style={{ color: "var(--text-secondary)" }}
            >
              <Lock size={10} /> {label}
            </p>
            <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
              {value || "—"}
            </p>
          </div>
        ))}
        <p className="sm:col-span-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          Son datos legales. Para cambiarlos, escríbele al equipo de EasyDocs.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EDITABLE_INSTITUTION_FIELDS.map((f) => {
            const invalid = f.type === "tel" && !isValidPhone(form[f.key]);
            return (
              <div key={f.key} className="min-w-0">
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {f.label}
                </label>
                <input
                  type={f.type || "text"}
                  inputMode={f.type === "tel" ? "tel" : undefined}
                  value={form[f.key] || ""}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, [f.key]: e.target.value }));
                    onError("");
                  }}
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: invalid ? "#dc2626" : "var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
                {invalid && (
                  <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                    Solo números, espacios, guiones y + (7 a 15 dígitos).
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Logo en los documentos
          </h3>
          <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
            Preferencias por defecto. Puedes cambiarlas en cada documento antes de generarlo.
          </p>

          <div
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border mb-3"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}
          >
            <div
              className="w-24 h-24 rounded-xl border flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ borderColor: "var(--border-color)", backgroundColor: "#ffffff" }}
            >
              {institution.logo_url ? (
                <img
                  src={institution.logo_url}
                  alt="Logo de la institución"
                  className="max-w-full max-h-full object-contain p-2"
                />
              ) : (
                <ImageIcon size={28} style={{ color: "var(--text-secondary)", opacity: 0.4 }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {institution.logo_url ? "Logo de la institución" : "Aún no has subido un logo"}
              </p>
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                PNG, JPG, WEBP o SVG, máximo 2 MB. Un PNG con fondo transparente se ve mejor como marca de agua.
              </p>
              <div className="flex flex-wrap gap-2">
                <label
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white ${uploadingLogo ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Upload size={14} />
                  {uploadingLogo
                    ? "Procesando..."
                    : institution.logo_url
                      ? "Cambiar logo"
                      : "Subir logo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
                {institution.logo_url && (
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    disabled={uploadingLogo}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border disabled:opacity-50"
                    style={{ borderColor: "#fecaca", color: "#dc2626", backgroundColor: "#fef2f2" }}
                  >
                    <Trash2 size={14} /> Quitar
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {LOGO_POSITIONS.map((p) => {
              const active = prefs.logo_position === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPrefs((s) => ({ ...s, logo_position: p.id }))}
                  className="px-4 py-2 rounded-xl border text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: active ? "var(--color-primary-light)" : "var(--bg-primary)",
                    borderColor: active ? "var(--color-primary)" : "var(--border-color)",
                    color: active ? "var(--color-primary)" : "var(--text-secondary)",
                  }}
                >
                  Logo arriba a la {p.label.toLowerCase()}
                </button>
              );
            })}
          </div>
          <label
            className={`flex items-start gap-3 p-4 rounded-xl border ${institution.logo_url ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
            style={{
              borderColor: prefs.logo_watermark ? "var(--color-primary)" : "var(--border-color)",
              backgroundColor: prefs.logo_watermark ? "var(--color-primary-light)" : "var(--bg-primary)",
            }}
          >
            <input
              type="checkbox"
              checked={prefs.logo_watermark}
              disabled={!institution.logo_url}
              onChange={(e) => setPrefs((s) => ({ ...s, logo_watermark: e.target.checked }))}
              className="w-4 h-4 mt-0.5 flex-shrink-0"
            />
            <span className="min-w-0">
              <span
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                <Droplets size={14} /> Usar mi logo como marca de agua
              </span>
              <span className="block text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {institution.logo_url
                  ? "Tu logo aparece grande, centrado y suave detrás del texto, en todas las páginas."
                  : "Primero sube el logo de tu institución."}
              </span>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors text-sm text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Save size={16} />
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function EmailChangeTab({ currentEmail, onSuccess, onError }) {
  const [step, setStep] = useState("form"); // form | verify
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch("/users/me/request-email-change", {
        new_email: newEmail,
        current_password: password,
      });
      setStep("verify");
      onError("");
    } catch (err) {
      onError(
        err.response?.data?.detail || "Error al solicitar el cambio de correo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch("/users/me/confirm-email-change", { code });
      onSuccess(
        `Tu correo fue actualizado a ${newEmail}. Vuelve a iniciar sesión.`,
      );
      setTimeout(() => {
        localStorage.clear();
        window.location.href = "/login";
      }, 2500);
    } catch (err) {
      onError(err.response?.data?.detail || "Código inválido o expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border p-4 md:p-6"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <h2 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        Cambiar correo
      </h2>
      <p className="text-xs mb-6" style={{ color: "var(--text-secondary)" }}>
        Correo actual: <span className="font-medium">{currentEmail}</span>
      </p>

      {step === "form" ? (
        <form onSubmit={handleRequest} className="space-y-4 max-w-md">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Nuevo correo electrónico
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="nuevo@correo.com"
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Confirma tu contraseña actual
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 pr-10 transition-all"
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

          <button
            type="submit"
            disabled={loading}
            className="font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors text-sm text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Mail size={16} />
            {loading ? "Enviando..." : "Enviar código de verificación"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4 max-w-md">
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ backgroundColor: "var(--color-primary-light)" }}
          >
            <Shield
              size={16}
              style={{ color: "var(--color-primary)" }}
              className="flex-shrink-0 mt-0.5"
            />
            <p className="text-xs" style={{ color: "var(--color-primary)" }}>
              Enviamos un código de 6 dígitos a <strong>{newEmail}</strong>.
              Ingrésalo para confirmar el cambio.
            </p>
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Código de verificación
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              placeholder="000000"
              className="w-full border rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="flex-1 py-3 rounded-xl text-sm font-medium border transition-colors"
              style={{
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex-1 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm text-white disabled:opacity-40"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {loading ? "Confirmando..." : "Confirmar cambio"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(
    TABS.some((t) => t.id === tabParam) ? tabParam : "institution",
  );
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
      className="min-h-screen flex overflow-x-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="md:ml-56 flex-1 flex flex-col min-w-0">
        <header
          className="border-b pl-16 pr-4 md:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-10"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1
                className="text-lg font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                Configuración
              </h1>
              <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                Tu cuenta y preferencias
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <NotificationBell/>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p
                className="hidden sm:block text-sm font-medium truncate max-w-[160px]"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.full_name}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full min-w-0">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <CheckCircle size={16} /> {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div
            className="grid grid-cols-2 sm:flex gap-1 rounded-2xl p-1 mb-6 border"
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-sm font-medium transition-colors min-w-0"
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

          {activeTab === "institution" && (
            <InstitutionTab
              onSuccess={(msg) => {
                setSuccess(msg);
                setTimeout(() => setSuccess(""), 3000);
              }}
              onError={(msg) => setError(msg)}
            />
          )}

          {activeTab === "account" && (
            <div
              className="rounded-2xl border p-4 md:p-6"
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
                  className="font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors text-sm text-white disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Save size={16} />
                  {saving ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "email" && (
            <EmailChangeTab
              currentEmail={user?.email}
              onSuccess={(msg) => setSuccess(msg)}
              onError={(msg) => setError(msg)}
            />
          )}

          {activeTab === "appearance" && (
            <AppearanceTab theme={theme} setTheme={setTheme} themes={themes} />
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
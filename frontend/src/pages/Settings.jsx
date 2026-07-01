import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import LogoutModal from "../components/LogoutModal";
import InactivityModal from "../components/InactivityModal";
import useInactivity from "../hooks/useInactivity";
import { useTheme } from "../context/ThemeContext";
import {
  Bell,
  ChevronLeft,
  Save,
  Upload,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Building2,
  User,
  Sun,
  Image,
} from "lucide-react";

const TABS = [
  { id: "institution", label: "Institución", icon: Building2 },
  { id: "account", label: "Mi cuenta", icon: User },
  { id: "appearance", label: "Apariencia", icon: Sun },
];

const inputStyle = {
  borderColor: "var(--border-color)",
  backgroundColor: "var(--bg-primary)",
  color: "var(--text-primary)",
};

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { theme, setTheme, themes } = useTheme();

  const [activeTab, setActiveTab] = useState("institution");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);

  const [instForm, setInstForm] = useState({
    name: "",
    dane_code: "",
    department: "",
    municipality: "",
    address: "",
    phone: "",
    email: "",
    education_level: "",
    license_number: "",
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  useEffect(() => {
    fetchInstitution();
  }, []);

  const fetchInstitution = async () => {
    try {
      const res = await api.get(`/institutions/${user.institution_id}`);
      setInstForm({
        name: res.data.name || "",
        dane_code: res.data.dane_code || "",
        department: res.data.department || "",
        municipality: res.data.municipality || "",
        address: res.data.address || "",
        phone: res.data.phone || "",
        email: res.data.email || "",
        education_level: res.data.education_level || "",
        license_number: res.data.license_number || "",
      });
      if (res.data.logo_url) setLogoPreview(res.data.logo_url);
    } catch (err) {
      setError("No se pudo cargar la información. Intenta de nuevo más tarde");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInstitution = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put("/institutions/my", instForm);
      setSuccess("Datos institucionales actualizados.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("El logo no debe superar 2MB.");
      return;
    }
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/institutions/my/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLogoPreview(res.data.logo_url);
      setSuccess("Logo actualizado exitosamente.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Error al subir el logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

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

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <Sidebar onLogout={() => setShowLogout(true)} />

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
              onClick={() => navigate("/dashboard")}
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
                Personaliza tu cuenta e institución
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2" style={{ color: "var(--text-secondary)" }}>
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
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

        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
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

          {/* Tabs */}
          <div
            className="flex gap-1 border rounded-xl p-1 mb-6"
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

          {/* Tab Institución */}
          {activeTab === "institution" && (
            <div className="space-y-6">
              {/* Logo */}
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
                  Logo institucional
                </h2>
                <p
                  className="text-xs mb-5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Aparecerá en los documentos PDF generados. Máximo 2MB.
                </p>
                <div className="flex items-center gap-6">
                  <div
                    className="w-24 h-24 border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Image
                        size={32}
                        style={{ color: "var(--text-secondary)", opacity: 0.4 }}
                      />
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex items-center gap-2 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      <Upload size={16} />
                      {uploadingLogo ? "Subiendo..." : "Subir logo"}
                    </button>
                    <p
                      className="text-xs mt-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      PNG, JPG o SVG. Fondo transparente recomendado.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Datos institucionales */}
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
                  Datos institucionales
                </h2>
                <p
                  className="text-xs mb-5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Esta información aparece en los documentos oficiales
                  generados.
                </p>
                <form onSubmit={handleSaveInstitution} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Nombre de la institución
                      </label>
                      <input
                        type="text"
                        value={instForm.name}
                        onChange={(e) =>
                          setInstForm((p) => ({ ...p, name: e.target.value }))
                        }
                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Código DANE
                      </label>
                      <input
                        type="text"
                        value={instForm.dane_code}
                        onChange={(e) =>
                          setInstForm((p) => ({
                            ...p,
                            dane_code: e.target.value,
                          }))
                        }
                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Resolución de funcionamiento
                      </label>
                      <input
                        type="text"
                        value={instForm.license_number}
                        onChange={(e) =>
                          setInstForm((p) => ({
                            ...p,
                            license_number: e.target.value,
                          }))
                        }
                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Departamento
                      </label>
                      <input
                        type="text"
                        value={instForm.department}
                        onChange={(e) =>
                          setInstForm((p) => ({
                            ...p,
                            department: e.target.value,
                          }))
                        }
                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Municipio
                      </label>
                      <input
                        type="text"
                        value={instForm.municipality}
                        onChange={(e) =>
                          setInstForm((p) => ({
                            ...p,
                            municipality: e.target.value,
                          }))
                        }
                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-span-2">
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={instForm.address}
                        onChange={(e) =>
                          setInstForm((p) => ({
                            ...p,
                            address: e.target.value,
                          }))
                        }
                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={instForm.phone}
                        onChange={(e) =>
                          setInstForm((p) => ({ ...p, phone: e.target.value }))
                        }
                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Correo institucional
                      </label>
                      <input
                        type="email"
                        value={instForm.email}
                        onChange={(e) =>
                          setInstForm((p) => ({ ...p, email: e.target.value }))
                        }
                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm disabled:opacity-40"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      <Save size={16} />
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tab Mi cuenta */}
          {activeTab === "account" && (
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              {/* Info usuario */}
              <div
                className="flex items-center gap-4 p-4 rounded-xl mb-6"
                style={{ backgroundColor: "var(--bg-primary)" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <span className="text-white font-bold text-lg">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user?.full_name}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {user?.email}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block"
                    style={{
                      backgroundColor: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>

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
                {[
                  { key: "current", label: "Contraseña actual" },
                  { key: "new", label: "Nueva contraseña" },
                  { key: "confirm", label: "Confirmar contraseña" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wide mb-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords[key] ? "text" : "password"}
                        value={passwords[key]}
                        onChange={(e) =>
                          handlePasswordChange(key, e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 pr-10"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((p) => ({ ...p, [key]: !p[key] }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {showPasswords[key] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {passwords.new && (
                  <div
                    className="space-y-2 p-3 rounded-lg"
                    style={{ backgroundColor: "var(--bg-primary)" }}
                  >
                    {[
                      { key: "length", label: "Mínimo 8 caracteres" },
                      { key: "uppercase", label: "Al menos una mayúscula" },
                      { key: "number", label: "Incluye números" },
                      { key: "special", label: "Carácter especial (!@#$%^&*)" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${passwordStrength[key] ? "bg-green-500 border-green-500" : "border-gray-300"}`}
                        >
                          {passwordStrength[key] && (
                            <CheckCircle size={10} className="text-white" />
                          )}
                        </div>
                        <span
                          className={`text-xs ${passwordStrength[key] ? "text-green-600" : ""}`}
                          style={
                            passwordStrength[key]
                              ? {}
                              : { color: "var(--text-secondary)" }
                          }
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Save size={16} />
                  {saving ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </form>
            </div>
          )}

          {/* Tab Apariencia */}
          {activeTab === "appearance" && (
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
                Apariencia
              </h2>
              <p
                className="text-xs mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                Elige el tema visual que más te guste. Se guarda por usuario.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                    style={{
                      borderColor:
                        theme === t.id
                          ? "var(--color-primary)"
                          : "var(--border-color)",
                      backgroundColor:
                        theme === t.id
                          ? "var(--color-primary-light)"
                          : "var(--bg-primary)",
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
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
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

              <div
                className="mt-6 rounded-xl p-4 flex items-start gap-3 border"
                style={{
                  backgroundColor: "var(--color-primary-light)",
                  borderColor: "var(--color-primary)",
                }}
              >
                <AlertCircle
                  size={16}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "var(--color-primary)" }}
                />
                <p className="text-xs" style={{ color: "var(--text-primary)" }}>
                  El tema se aplica instantáneamente y se guarda para tus
                  próximas visitas. Cada usuario de tu institución puede elegir
                  su propio tema.
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

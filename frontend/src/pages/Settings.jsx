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
  Settings as SettingsIcon,
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
  Moon,
  Sun,
  Image,
} from "lucide-react";

const TABS = [
  { id: "institution", label: "Institución", icon: Building2 },
  { id: "account", label: "Mi cuenta", icon: User },
  { id: "appearance", label: "Apariencia", icon: Sun },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("institution");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { theme, setTheme, themes } = useTheme();

  // Datos institución
  const [institution, setInstitution] = useState(null);
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

  // Datos cuenta
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
      setInstitution(res.data);
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
      console.error(err);
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("darkMode", !darkMode);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar onLogout={() => setShowLogout(true)} />

      <main className="ml-56 flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Configuración
              </h1>
              <p className="text-xs text-gray-400">
                Personaliza tu cuenta e institución
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2952cc] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800">
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
          <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-6">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === id
                    ? "bg-[#2952cc] text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
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
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-1">
                  Logo institucional
                </h2>
                <p className="text-xs text-gray-400 mb-5">
                  Aparecerá en los documentos PDF generados. Máximo 2MB.
                </p>

                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Image size={32} className="text-gray-300" />
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex items-center gap-2 bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
                    >
                      <Upload size={16} />
                      {uploadingLogo ? "Subiendo..." : "Subir logo"}
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
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
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-1">
                  Datos institucionales
                </h2>
                <p className="text-xs text-gray-400 mb-5">
                  Esta información aparece en los documentos oficiales
                  generados.
                </p>

                <form onSubmit={handleSaveInstitution} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Nombre de la institución
                      </label>
                      <input
                        type="text"
                        value={instForm.name}
                        onChange={(e) =>
                          setInstForm((p) => ({ ...p, name: e.target.value }))
                        }
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
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
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
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
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
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
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
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
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
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
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={instForm.phone}
                        onChange={(e) =>
                          setInstForm((p) => ({ ...p, phone: e.target.value }))
                        }
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Correo institucional
                      </label>
                      <input
                        type="email"
                        value={instForm.email}
                        onChange={(e) =>
                          setInstForm((p) => ({ ...p, email: e.target.value }))
                        }
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
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
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-1">
                Cambiar contraseña
              </h2>
              <p className="text-xs text-gray-400 mb-5">
                Usa una contraseña segura que no uses en otros sitios.
              </p>

              <form
                onSubmit={handleSavePassword}
                className="space-y-4 max-w-md"
              >
                {["current", "new", "confirm"].map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {field === "current"
                        ? "Contraseña actual"
                        : field === "new"
                          ? "Nueva contraseña"
                          : "Confirmar contraseña"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords[field] ? "text" : "password"}
                        value={passwords[field]}
                        onChange={(e) =>
                          handlePasswordChange(field, e.target.value)
                        }
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((p) => ({
                            ...p,
                            [field]: !p[field],
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords[field] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {passwords.new && (
                  <div className="space-y-2">
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
                          className={`text-xs ${passwordStrength[key] ? "text-green-600" : "text-gray-400"}`}
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
                  className="bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                  <Save size={16} />
                  {saving ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </form>
            </div>
          )}

          {/* Tab Apariencia */}
          {activeTab === "appearance" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-1">Apariencia</h2>
              <p className="text-xs text-gray-400 mb-6">
                Elige el tema visual que más te guste para EasyDocs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      theme === t.id
                        ? "border-[#2952cc] bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex-shrink-0 shadow-inner"
                      style={{ backgroundColor: t.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {t.label}
                      </p>
                      <p className="text-xs text-gray-400">{t.description}</p>
                    </div>
                    {theme === t.id && (
                      <CheckCircle
                        size={18}
                        className="text-[#2952cc] flex-shrink-0"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle
                  size={16}
                  className="text-[#2952cc] flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-blue-700">
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

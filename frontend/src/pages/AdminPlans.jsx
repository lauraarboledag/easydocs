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
  Shield,
  CheckCircle,
  Edit2,
  Zap,
  Star,
  Building2,
  X,
  Save,
  AlertCircle,
  Eye,
  Plus,
} from "lucide-react";

const PLAN_META = {
  free: { label: "Free", icon: Shield, color: "#6b7280", bg: "#f3f4f6" },
  basic: {
    label: "Básico",
    icon: Zap,
    color: "var(--color-primary)",
    bg: "var(--color-primary-light)",
  },
  professional: {
    label: "Profesional",
    icon: Star,
    color: "#9333ea",
    bg: "#faf5ff",
  },
  enterprise: {
    label: "Empresarial",
    icon: Building2,
    color: "#ca8a04",
    bg: "#fefce8",
  },
};

const PLAN_FEATURES = {
  free: ["LR001 – LR009", "1 usuario", "10 documentos / mes"],
  basic: ["LR001 – LR009", "3 usuarios", "50 documentos / mes"],
  professional: [
    "LR001 – LR009",
    "Certificados Capítulo II",
    "10 usuarios",
    "200 documentos / mes",
    "EduBot IA",
  ],
  enterprise: [
    "LR001 – LR009",
    "Certificados Capítulo II",
    "Usuarios ilimitados",
    "Documentos ilimitados",
    "EduBot IA",
    "Transcripción de audio IA",
  ],
};

const PLAN_NAME_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Básico" },
  { value: "professional", label: "Profesional" },
  { value: "enterprise", label: "Empresarial" },
];

const DEFAULT_FEATURES = {
  free: {
    documentos_lr001_lr009: true,
    certificados_capitulo_ii: false,
    edubot: false,
    transcripcion_audio: false,
    usuarios_maximos: 1,
    documentos_por_mes: 10,
    soporte: "ninguno",
  },
  basic: {
    documentos_lr001_lr009: true,
    certificados_capitulo_ii: false,
    edubot: false,
    transcripcion_audio: false,
    usuarios_maximos: 3,
    documentos_por_mes: 50,
    soporte: "email",
  },
  professional: {
    documentos_lr001_lr009: true,
    certificados_capitulo_ii: true,
    edubot: true,
    transcripcion_audio: false,
    usuarios_maximos: 10,
    documentos_por_mes: 200,
    soporte: "email_chat",
  },
  enterprise: {
    documentos_lr001_lr009: true,
    certificados_capitulo_ii: true,
    edubot: true,
    transcripcion_audio: true,
    usuarios_maximos: null,
    documentos_por_mes: null,
    soporte: "prioritario",
  },
};

function formatPrice(price) {
  if (price === 0) return "Gratis";
  return `$${(price / 100).toLocaleString("es-CO")} COP`;
}

function CycleToggle({ value, onChange }) {
  return (
    <div
      className="flex items-center rounded-xl p-1"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {["monthly", "annual"].map((cycle) => (
        <button
          key={cycle}
          onClick={() => onChange(cycle)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor:
              value === cycle ? "var(--bg-secondary)" : "transparent",
            color:
              value === cycle ? "var(--text-primary)" : "var(--text-secondary)",
            boxShadow: value === cycle ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          {cycle === "monthly" ? "Mensual" : "Anual"}
        </button>
      ))}
    </div>
  );
}

function PlanTableRow({ plan, onEdit }) {
  const meta = PLAN_META[plan.name] || PLAN_META.free;
  const Icon = meta.icon;
  return (
    <div
      className="grid grid-cols-12 items-center px-6 py-4 border-b last:border-0 transition-colors"
      style={{ borderColor: "var(--border-color)" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "var(--bg-primary)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
    >
      <div className="col-span-3 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: meta.bg }}
        >
          <Icon size={15} style={{ color: meta.color }} />
        </div>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Plan {meta.label}
        </p>
      </div>
      <div className="col-span-2">
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-secondary)",
          }}
        >
          {plan.billing_cycle === "monthly" ? "Mensual" : "Anual"}
        </span>
      </div>
      <div className="col-span-3">
        <p
          className="text-sm font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {formatPrice(plan.price)}
        </p>
        {plan.price > 0 && (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {plan.billing_cycle === "monthly" ? "/ mes" : "/ año"}
          </p>
        )}
      </div>
      <div className="col-span-2">
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1"
          style={{
            backgroundColor: plan.is_active ? "#f0fdf4" : "#fee2e2",
            color: plan.is_active ? "#16a34a" : "#dc2626",
          }}
        >
          {plan.is_active ? (
            <>
              <CheckCircle size={11} /> Activo
            </>
          ) : (
            "Inactivo"
          )}
        </span>
      </div>
      <div className="col-span-2 flex justify-end">
        <button
          onClick={() => onEdit(plan)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{
            backgroundColor: "var(--color-primary-light)",
            color: "var(--color-primary)",
          }}
        >
          <Edit2 size={12} /> Editar
        </button>
      </div>
    </div>
  );
}

function PlanPreviewCard({ planName, plan, previewCycle }) {
  const meta = PLAN_META[planName];
  const Icon = meta.icon;
  return (
    <div
      className="rounded-2xl border-2 p-5 flex flex-col"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor:
          planName === "professional" ? "#9333ea" : "var(--border-color)",
      }}
    >
      {planName === "professional" && (
        <div className="text-center mb-2">
          <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Más popular
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: meta.bg }}
        >
          <Icon size={15} style={{ color: meta.color }} />
        </div>
        <p
          className="text-sm font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Plan {meta.label}
        </p>
      </div>
      <div className="mb-4">
        <span
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {plan ? formatPrice(plan.price) : "—"}
        </span>
        {plan && plan.price > 0 && (
          <span
            className="text-xs ml-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {previewCycle === "monthly" ? "/ mes" : "/ año"}
          </span>
        )}
      </div>
      <ul className="space-y-1.5 flex-1">
        {(PLAN_FEATURES[planName] || []).map((f) => (
          <li
            key={f}
            className="flex items-center gap-2 text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            <CheckCircle size={11} className="text-green-500 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <div
        className="mt-4 py-2 rounded-xl text-xs font-semibold text-center"
        style={{
          backgroundColor: "var(--color-primary-light)",
          color: "var(--color-primary)",
        }}
      >
        Seleccionar
      </div>
    </div>
  );
}

function EditPlanModal({
  plan,
  editForm,
  setEditForm,
  onSave,
  onClose,
  saving,
  error,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl shadow-xl w-full max-w-md"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div>
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Editar Plan {PLAN_META[plan.name]?.label}
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {plan.billing_cycle === "monthly"
                ? "Facturación mensual"
                : "Facturación anual"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Precio (en COP)
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                $
              </span>
              <input
                type="number"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, price: e.target.value }))
                }
                placeholder="0"
                className="w-full border rounded-lg pl-7 pr-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Ingresa el valor en pesos colombianos. Ej: 150000 para $150.000
              COP
            </p>
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Estado del plan
            </label>
            <div className="flex gap-3">
              {[
                {
                  value: true,
                  label: "Activo",
                  bg: "#f0fdf4",
                  color: "#16a34a",
                },
                {
                  value: false,
                  label: "Inactivo",
                  bg: "#fee2e2",
                  color: "#dc2626",
                },
              ].map(({ value, label, bg, color }) => (
                <button
                  key={label}
                  onClick={() =>
                    setEditForm((p) => ({ ...p, is_active: value }))
                  }
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors"
                  style={{
                    backgroundColor:
                      editForm.is_active === value ? bg : "var(--bg-primary)",
                    color:
                      editForm.is_active === value
                        ? color
                        : "var(--text-secondary)",
                    borderColor:
                      editForm.is_active === value
                        ? color
                        : "var(--border-color)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: "var(--color-primary-light)",
              borderColor: "var(--color-primary)",
            }}
          >
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: "var(--color-primary)" }}
            >
              Vista previa del precio
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {editForm.price > 0
                ? `$${parseFloat(editForm.price || 0).toLocaleString("es-CO")} COP`
                : "Gratis"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {plan.billing_cycle === "monthly" ? "/ mes" : "/ año"}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 border font-medium py-3 rounded-lg transition-colors"
              style={{
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Save size={16} />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatePlanModal({ form, setForm, onSave, onClose, saving, error }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl shadow-xl w-full max-w-md"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div>
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Crear nuevo plan
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Define el nombre, ciclo y precio del plan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Nombre del plan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PLAN_NAME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setForm((p) => ({ ...p, name: value }))}
                  className="py-2.5 rounded-lg text-sm font-medium border-2 transition-colors"
                  style={{
                    backgroundColor:
                      form.name === value
                        ? "var(--color-primary-light)"
                        : "var(--bg-primary)",
                    color:
                      form.name === value
                        ? "var(--color-primary)"
                        : "var(--text-secondary)",
                    borderColor:
                      form.name === value
                        ? "var(--color-primary)"
                        : "var(--border-color)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Ciclo de facturación
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "monthly", label: "Mensual" },
                { value: "annual", label: "Anual" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() =>
                    setForm((p) => ({ ...p, billing_cycle: value }))
                  }
                  className="py-2.5 rounded-lg text-sm font-medium border-2 transition-colors"
                  style={{
                    backgroundColor:
                      form.billing_cycle === value
                        ? "var(--color-primary-light)"
                        : "var(--bg-primary)",
                    color:
                      form.billing_cycle === value
                        ? "var(--color-primary)"
                        : "var(--text-secondary)",
                    borderColor:
                      form.billing_cycle === value
                        ? "var(--color-primary)"
                        : "var(--border-color)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Precio (en COP)
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                $
              </span>
              <input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm((p) => ({ ...p, price: e.target.value }))
                }
                placeholder="0"
                className="w-full border rounded-lg pl-7 pr-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Deja en 0 para plan gratuito. Se usan las características por
              defecto del plan según el nombre elegido.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 border font-medium py-3 rounded-lg transition-colors"
              style={{
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Plus size={16} />
              {saving ? "Creando..." : "Crear plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPlans() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState({ price: "", is_active: true });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "free",
    billing_cycle: "monthly",
    price: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [tableCycle, setTableCycle] = useState("monthly");
  const [previewCycle, setPreviewCycle] = useState("monthly");

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
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get("/plans/");
      setPlans(res.data);
    } catch {
      setError("Error cargando los planes. Recarga la página.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setEditForm({
      price: (plan.price / 100).toString(),
      is_active: plan.is_active,
    });
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.put(`/plans/${editingPlan.id}`, {
        price: Math.round(parseFloat(editForm.price) * 100),
        is_active: editForm.is_active,
      });
      setSuccess(`Plan ${editingPlan.name} actualizado correctamente.`);
      setEditingPlan(null);
      fetchPlans();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al actualizar el plan.");
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setCreateForm({ name: "free", billing_cycle: "monthly", price: "" });
    setError("");
    setShowCreate(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post("/plans/", {
        name: createForm.name,
        billing_cycle: createForm.billing_cycle,
        price: Math.round(parseFloat(createForm.price || 0) * 100),
        features: DEFAULT_FEATURES[createForm.name],
      });
      setSuccess(
        `Plan ${PLAN_META[createForm.name].label} creado correctamente.`,
      );
      setShowCreate(false);
      fetchPlans();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al crear el plan.");
    } finally {
      setSaving(false);
    }
  };

  const grouped = {};
  for (const plan of plans) {
    if (!grouped[plan.name]) grouped[plan.name] = {};
    grouped[plan.name][plan.billing_cycle] = plan;
  }

  const planNames = ["free", "basic", "professional", "enterprise"];
  const filteredPlans = plans.filter((p) => p.billing_cycle === tableCycle);

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
                Planes
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Gestión de planes y precios de suscripción
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

        <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <CheckCircle size={16} /> {success}
            </div>
          )}
          {error && !editingPlan && !showCreate && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Tabla de planes */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Planes registrados
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {filteredPlans.length} planes{" "}
                  {tableCycle === "monthly" ? "mensuales" : "anuales"} — edita
                  precios y estado directamente
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={openCreate}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-colors"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Plus size={15} /> Crear plan
                </button>
                <CycleToggle value={tableCycle} onChange={setTableCycle} />
              </div>
            </div>

            <div
              className="rounded-xl border"
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
                  Cargando planes...
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center py-16">
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Sin planes{" "}
                    {tableCycle === "monthly" ? "mensuales" : "anuales"}{" "}
                    registrados aún
                  </p>
                  <button
                    onClick={openCreate}
                    className="mt-3 text-sm font-medium hover:underline"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Crear el primero →
                  </button>
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
                    <span className="col-span-3">Plan</span>
                    <span className="col-span-2">Ciclo</span>
                    <span className="col-span-3">Precio</span>
                    <span className="col-span-2">Estado</span>
                    <span className="col-span-2 text-right">Acciones</span>
                  </div>
                  {filteredPlans.map((plan) => (
                    <PlanTableRow
                      key={plan.id}
                      plan={plan}
                      onEdit={handleEdit}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Vista previa */}
          <div
            className="rounded-xl border p-6"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Eye size={16} style={{ color: "var(--color-primary)" }} />
                  <h3
                    className="font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Vista previa — como lo ven las instituciones
                  </h3>
                </div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Así se muestran los planes en el registro y checkout
                </p>
              </div>
              <CycleToggle value={previewCycle} onChange={setPreviewCycle} />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {planNames.map((planName) => {
                const planGroup = grouped[planName];
                if (!planGroup) return null;
                const plan = planGroup[previewCycle] || planGroup["monthly"];
                return (
                  <PlanPreviewCard
                    key={planName}
                    planName={planName}
                    plan={plan}
                    previewCycle={previewCycle}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          editForm={editForm}
          setEditForm={setEditForm}
          onSave={handleSave}
          onClose={() => setEditingPlan(null)}
          saving={saving}
          error={error}
        />
      )}

      {showCreate && (
        <CreatePlanModal
          form={createForm}
          setForm={setCreateForm}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
          saving={saving}
          error={error}
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

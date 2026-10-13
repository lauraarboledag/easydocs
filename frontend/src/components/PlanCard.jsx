import { Landmark } from "lucide-react";

// Tarjeta decorativa del plan (Checkout y Suscripción).
// Solo muestra lo que se compra o se tiene; nunca datos bancarios.

const PLAN_LABELS = {
    free: "Free",
    basic: "Básico",
    professional: "Profesional",
    enterprise: "Empresarial",
};

export const PLAN_GRADIENTS = {
    free: "linear-gradient(135deg, #1f2937 0%, #4b5563 100%)",
    basic: "linear-gradient(135deg, #0b1a45 0%, #1e3a8a 55%, #2952cc 100%)",
    professional: "linear-gradient(135deg, #24093f 0%, #5b1d91 55%, #9333ea 100%)",
    enterprise: "linear-gradient(135deg, #1c1917 0%, #3f3a36 50%, #a16207 100%)",
    none: "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
};

function formatAmount(price) {
    if (!price) return "Gratis";
    return `$${(price / 100).toLocaleString("es-CO")}`;
}

/**
 * plan: { id, name, price } | null
 * cycle: "monthly" | "annual"
 * method: "wompi" | "transfer" | null (null = tarjeta del plan actual)
 * caption: texto junto al chip (opcional)
 */
export default function PlanCard({ plan, cycle, institutionName, method = null, caption }) {
    const label = plan ? PLAN_LABELS[plan.name] || plan.name : null;
    const chipText =
        caption ||
        (method === "wompi"
            ? "Pago seguro con Wompi"
            : method === "transfer"
                ? "Transferencia bancaria"
                : "Plan de tu institución");

    return (
        <div
            key={`${plan?.id || "none"}-${method}`}
            aria-hidden="true"
            className="ed-plan-card relative w-full max-w-sm aspect-[1.586] rounded-2xl p-5 text-white overflow-hidden shadow-xl select-none flex flex-col justify-between"
            style={{ background: PLAN_GRADIENTS[plan?.name] || PLAN_GRADIENTS.none }}
        >
            <style>{`
        @keyframes edCardIn { from { opacity: .5; transform: translateY(6px) scale(.98) } to { opacity: 1; transform: none } }
        .ed-plan-card { animation: edCardIn .45s ease }
        @media (prefers-reduced-motion: reduce) { .ed-plan-card { animation: none } }
      `}</style>
            {/* Brillos de fondo */}
            <div className="absolute -right-12 -top-16 w-48 h-48 rounded-full bg-white/10" />
            <div className="absolute -left-10 -bottom-20 w-56 h-56 rounded-full bg-white/5" />

            <div className="relative flex items-start justify-between gap-2">
                <span className="text-xs font-bold tracking-[0.25em]">EASYDOCS</span>
                <span className="text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full border border-white/40 bg-white/10 uppercase">
                    {label || "Elige un plan"}
                </span>
            </div>

            <div className="relative flex items-center gap-3">
                {method === "transfer" ? (
                    <div className="w-11 h-8 rounded-md bg-white/15 flex items-center justify-center">
                        <Landmark size={16} />
                    </div>
                ) : (
                    <div
                        className="w-11 h-8 rounded-md"
                        style={{
                            background: "linear-gradient(135deg, #f5d98b 0%, #c9a24a 50%, #f1d27a 100%)",
                            boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)",
                        }}
                    />
                )}
                <span className="text-[11px] text-white/80">{chipText}</span>
            </div>

            <div className="relative">
                <p className="text-2xl sm:text-3xl font-bold leading-none">
                    {plan ? formatAmount(plan.price) : "—"}
                    {plan && plan.price > 0 && (
                        <span className="text-xs font-medium text-white/70 ml-1">
                            COP {cycle === "annual" ? "/ año" : "/ mes"}
                        </span>
                    )}
                </p>
            </div>

            <div className="relative flex items-end justify-between gap-3 text-[11px] font-semibold tracking-wider">
                <span className="truncate uppercase">{institutionName || "Tu institución"}</span>
                <span className="flex-shrink-0">
                    {plan && plan.price === 0 ? "SIN VENCIMIENTO" : cycle === "annual" ? "ANUAL" : "MENSUAL"}
                </span>
            </div>
        </div>
    );
}
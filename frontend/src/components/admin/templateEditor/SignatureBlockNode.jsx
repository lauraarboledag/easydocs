import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Plus, X } from "lucide-react";

function SignatureBlockView({ node, updateAttributes }) {
    const labels = node.attrs.labels;

    const updateLabel = (index, value) => {
        const next = [...labels];
        next[index] = value;
        updateAttributes({ labels: next });
    };

    const addSignature = () => {
        updateAttributes({ labels: [...labels, "Firma"] });
    };

    const removeSignature = (index) => {
        if (labels.length <= 1) return;
        updateAttributes({ labels: labels.filter((_, i) => i !== index) });
    };

    return (
        <NodeViewWrapper className="my-3" contentEditable={false}>
            <div
                className="border rounded-lg p-4"
                style={{ borderColor: "var(--border-color)" }}
            >
                <div className="flex gap-4 justify-around flex-wrap">
                    {labels.map((label, i) => (
                        <div key={i} className="text-center w-40">
                            <div
                                className="border-t mb-1.5"
                                style={{ borderColor: "var(--text-primary)" }}
                            />
                            <div className="flex items-center gap-1 justify-center">
                                <input
                                    value={label}
                                    onChange={(e) => updateLabel(i, e.target.value)}
                                    className="text-center text-xs font-semibold bg-transparent outline-none min-w-0"
                                    style={{ color: "var(--text-primary)" }}
                                />
                                {labels.length > 1 && (
                                    <button
                                        onClick={() => removeSignature(i)}
                                        className="opacity-40 hover:opacity-100 flex-shrink-0"
                                    >
                                        <X size={11} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={addSignature}
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-xs mt-3 border-t pt-3"
                    style={{ borderColor: "var(--border-color)", color: "var(--color-primary)" }}
                >
                    <Plus size={12} /> Agregar firma
                </button>
            </div>
        </NodeViewWrapper>
    );
}

export const SignatureBlockNode = Node.create({
    name: "signatureBlock",
    group: "block",
    atom: true,

    addAttributes() {
        return {
            labels: { default: ["Estudiante", "Rector / Director"] },
        };
    },

    parseHTML() {
        return [{ tag: "div[data-signature-block]" }];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, {
                "data-signature-block": JSON.stringify(node.attrs.labels),
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SignatureBlockView);
    },
});
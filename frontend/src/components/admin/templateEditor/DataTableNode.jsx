import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Plus, X } from "lucide-react";

function DataTableView({ node, updateAttributes, extension }) {
    const rows = node.attrs.rows; // [{ label, jinjaKey }]
    const variables = extension.options.variables || [];

    const updateRow = (index, key, value) => {
        const next = [...rows];
        next[index] = { ...next[index], [key]: value };
        updateAttributes({ rows: next });
    };

    const addRow = () => {
        const fallback = variables[0];
        updateAttributes({
            rows: [
                ...rows,
                { label: "Nueva etiqueta", jinjaKey: fallback?.jinjaKey || "" },
            ],
        });
    };

    const removeRow = (index) => {
        if (rows.length <= 1) return;
        updateAttributes({ rows: rows.filter((_, i) => i !== index) });
    };

    return (
        <NodeViewWrapper className="my-3" contentEditable={false}>
            <div
                className="border rounded-lg overflow-hidden"
                style={{ borderColor: "var(--border-color)" }}
            >
                <table className="w-full text-xs">
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                                <td
                                    className="p-0 border-r w-1/3"
                                    style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}
                                >
                                    <input
                                        value={row.label}
                                        onChange={(e) => updateRow(i, "label", e.target.value)}
                                        className="w-full px-2 py-1.5 bg-transparent text-xs font-semibold outline-none"
                                        style={{ color: "var(--text-primary)" }}
                                        placeholder="Etiqueta (ej: Documento de identidad)"
                                    />
                                </td>
                                <td className="p-0">
                                    <div className="flex items-center gap-1 px-2 py-1.5">
                                        <select
                                            value={row.jinjaKey}
                                            onChange={(e) => updateRow(i, "jinjaKey", e.target.value)}
                                            className="flex-1 min-w-0 bg-transparent text-xs outline-none"
                                            style={{ color: "var(--text-primary)" }}
                                        >
                                            {variables.map((v) => (
                                                <option key={v.jinjaKey} value={v.jinjaKey}>
                                                    {v.label}
                                                </option>
                                            ))}
                                        </select>
                                        {rows.length > 1 && (
                                            <button onClick={() => removeRow(i)} className="opacity-40 hover:opacity-100 flex-shrink-0">
                                                <X size={11} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button
                    onClick={addRow}
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-xs border-t"
                    style={{ borderColor: "var(--border-color)", color: "var(--color-primary)" }}
                >
                    <Plus size={12} /> Agregar fila
                </button>
            </div>
        </NodeViewWrapper>
    );
}

export const DataTableNode = Node.create({
    name: "dataTable",
    group: "block",
    atom: true,

    addOptions() {
        return { variables: [] };
    },

    addAttributes() {
        return {
            rows: {
                default: [{ label: "Etiqueta", jinjaKey: "" }],
            },
        };
    },

    parseHTML() {
        return [{ tag: "div[data-data-table]" }];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, {
                "data-data-table": JSON.stringify(node.attrs.rows),
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(DataTableView);
    },
});
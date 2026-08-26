import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Plus, X } from "lucide-react";

function DynamicTableView({ node, updateAttributes }) {
  const columns = node.attrs.columns;

  const updateColumn = (index, value) => {
    const next = [...columns];
    next[index] = value;
    updateAttributes({ columns: next });
  };

  const addColumn = () => {
    updateAttributes({ columns: [...columns, "Nueva columna"] });
  };

  const removeColumn = (index) => {
    if (columns.length <= 1) return; // siempre debe quedar al menos 1
    updateAttributes({ columns: columns.filter((_, i) => i !== index) });
  };

  return (
    <NodeViewWrapper className="my-3" contentEditable={false}>
      <div
        className="border rounded-lg overflow-hidden"
        style={{ borderColor: "var(--border-color)" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: "var(--bg-secondary)" }}>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="p-0 border-r"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <input
                      value={col}
                      onChange={(e) => updateColumn(i, e.target.value)}
                      className="flex-1 min-w-0 bg-transparent text-xs font-semibold outline-none"
                      style={{ color: "var(--text-primary)" }}
                    />
                    {columns.length > 1 && (
                      <button
                        onClick={() => removeColumn(i)}
                        className="opacity-40 hover:opacity-100 flex-shrink-0"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="p-1 w-8">
                <button
                  onClick={addColumn}
                  className="w-full flex items-center justify-center py-1 rounded"
                  style={{ color: "var(--color-primary)" }}
                  title="Agregar columna"
                >
                  <Plus size={13} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length + 1}
                className="text-center py-2 text-xs italic"
                style={{ color: "var(--text-secondary)" }}
              >
                Las filas se completan automáticamente al generar el documento
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </NodeViewWrapper>
  );
}

export const DynamicTableNode = Node.create({
  name: "dynamicTable",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      columns: { default: ["Columna 1", "Columna 2"] },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-dynamic-table]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    // Marcador temporal — en la Fase 3 el compilador lo convierte
    // en la tabla HTML real con {{ filas_x }} en el cuerpo
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-dynamic-table": JSON.stringify(node.attrs.columns),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DynamicTableView);
  },
});
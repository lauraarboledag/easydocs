import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";

// Componente visual del chip — esto es lo que el superadmin VE en el editor
function VariableChipView({ node }) {
  return (
    <NodeViewWrapper as="span" className="inline-block">
      <span
        contentEditable={false}
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono select-none"
        style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
      >
        {node.attrs.label}
      </span>
    </NodeViewWrapper>
  );
}

// Definición del nodo Tiptap — esto es cómo Tiptap lo entiende internamente
export const VariableNode = Node.create({
  name: "variableChip",
  group: "inline",
  inline: true,
  atom: true, // se comporta como una unidad indivisible, no como texto editable

  addAttributes() {
    return {
      // el valor real que irá en el HTML final, ej: "nombre_estudiante" o "institucion.nombre"
      jinjaKey: { default: null },
      // el texto legible que ve el superadmin, ej: "Nombre del estudiante"
      label: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-variable]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    // esto es lo que se genera al exportar a HTML/Jinja2 real
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-variable": node.attrs.jinjaKey }),
      `{{ ${node.attrs.jinjaKey} }}`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableChipView);
  },
});

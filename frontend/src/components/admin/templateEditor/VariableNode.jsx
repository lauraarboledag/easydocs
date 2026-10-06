import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";

function VariableChipView({ node, updateAttributes, extension }) {
  const variables = extension.options.variables || [];
  const currentKey = node.attrs.jinjaKey || "";
  // Si la plantilla usa una variable que no está en la lista, se muestra tal
  // cual; si no, el <select> mostraría la primera opción y confundiría.
  const isUnknown =
    currentKey && !variables.some((v) => v.jinjaKey === currentKey);

  return (
    <NodeViewWrapper as="span" className="inline-block" contentEditable={false}>
      <select
        value={currentKey}
        onChange={(e) => {
          const variable = variables.find((v) => v.jinjaKey === e.target.value);
          if (variable) {
            updateAttributes({ jinjaKey: variable.jinjaKey, label: variable.label });
          }
        }}
        className="text-xs font-mono px-1.5 py-0.5 rounded border-0 outline-none cursor-pointer"
        style={{
          backgroundColor: isUnknown ? "#fef3c7" : "#dbeafe",
          color: isUnknown ? "#b45309" : "#1d4ed8",
        }}
        title={isUnknown ? `Variable personalizada: ${currentKey}` : undefined}
      >
        {!currentKey && <option value="">Selecciona una variable…</option>}
        {isUnknown && (
          <option value={currentKey}>{currentKey} (personalizada)</option>
        )}
        {variables.map((v) => (
          <option key={v.jinjaKey} value={v.jinjaKey}>
            {v.label}
          </option>
        ))}
      </select>
    </NodeViewWrapper>
  );
}

export const VariableNode = Node.create({
  name: "variableChip",
  group: "inline",
  inline: true,
  atom: true,

  addOptions() {
    return { variables: [] };
  },

  addAttributes() {
    return {
      jinjaKey: { default: null },
      label: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-variable]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
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
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";

function VariableChipView({ node, updateAttributes, extension }) {
  const variables = extension.options.variables || [];

  return (
    <NodeViewWrapper as="span" className="inline-block" contentEditable={false}>
      <select
        value={node.attrs.jinjaKey || ""}
        onChange={(e) => {
          const variable = variables.find((v) => v.jinjaKey === e.target.value);
          if (variable) {
            updateAttributes({ jinjaKey: variable.jinjaKey, label: variable.label });
          }
        }}
        className="text-xs font-mono px-1.5 py-0.5 rounded border-0 outline-none cursor-pointer"
        style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
      >
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
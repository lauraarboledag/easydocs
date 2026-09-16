import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { GitBranch } from "lucide-react";

function ConditionalSectionView({ node, updateAttributes }) {
  return (
    <NodeViewWrapper
      className="my-3 border-2 border-dashed rounded-lg p-3"
      style={{ borderColor: "var(--color-primary)" }}
    >
      <div
        contentEditable={false}
        className="flex items-center gap-2 mb-3 text-xs"
        style={{ color: "var(--color-primary)" }}
      >
        <GitBranch size={13} />
        <span className="font-semibold">Mostrar solo si:</span>
        <input
          value={node.attrs.conditionVar}
          onChange={(e) => updateAttributes({ conditionVar: e.target.value })}
          placeholder="ej: es_menor_edad"
          className="flex-1 min-w-0 px-2 py-1 rounded border font-mono text-xs"
          style={{
            borderColor: "var(--color-primary)",
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
          }}
        />
        <span className="opacity-70">es verdadero</span>
      </div>
      <NodeViewContent />
    </NodeViewWrapper>
  );
}

export const ConditionalSectionNode = Node.create({
  name: "conditionalSection",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      conditionVar: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-conditional-section]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-conditional-section": node.attrs.conditionVar,
      }),
      0, // el 0 le dice a Tiptap "aquí va el contenido interno de verdad"
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ConditionalSectionView);
  },
});
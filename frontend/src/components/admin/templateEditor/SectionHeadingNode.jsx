import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";

const LEVEL_STYLES = {
    1: "text-xl font-bold",
    2: "text-lg font-bold",
    3: "text-base font-bold",
    4: "text-sm font-bold uppercase tracking-wide",
};

function SectionHeadingView({ node, updateAttributes }) {
    const { level, text } = node.attrs;

    return (
        <NodeViewWrapper className="my-2" contentEditable={false}>
            <div className="flex items-center gap-2">
                <select
                    value={level}
                    onChange={(e) =>
                        updateAttributes({ level: parseInt(e.target.value) })
                    }
                    className="text-xs border rounded px-1.5 py-1 font-mono flex-shrink-0"
                    style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-secondary)",
                    }}
                >
                    <option value={1}>H1</option>
                    <option value={2}>H2</option>
                    <option value={3}>H3</option>
                    <option value={4}>H4</option>
                </select>
                <input
                    value={text}
                    onChange={(e) => updateAttributes({ text: e.target.value })}
                    placeholder="Título de la sección..."
                    className={`flex-1 min-w-0 bg-transparent outline-none border-b border-transparent focus:border-current ${LEVEL_STYLES[level]}`}
                    style={{ color: "var(--text-primary)" }}
                />
            </div>
        </NodeViewWrapper>
    );
}

export const SectionHeadingNode = Node.create({
    name: "sectionHeading",
    group: "block",
    atom: true,

    addAttributes() {
        return {
            level: { default: 2 },
            text: { default: "" },
        };
    },

    parseHTML() {
        return [{ tag: "div[data-section-heading]" }];
    },

    renderHTML({ node, HTMLAttributes }) {
        // Marcador temporal — el compilador de la Fase 3 lo convierte
        // en <h1>/<h2>/<h3>/<h4> real según "level"
        return [
            "div",
            mergeAttributes(HTMLAttributes, {
                "data-section-heading": node.attrs.level,
            }),
            node.attrs.text,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SectionHeadingView);
    },
});
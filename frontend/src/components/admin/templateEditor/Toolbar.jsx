import { Bold, Italic, Underline as UnderlineIcon } from "lucide-react";

function ToolbarButton({ active, onClick, children, title }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors"
            style={{
                backgroundColor: active ? "var(--color-primary-light)" : "transparent",
                color: active ? "var(--color-primary)" : "var(--text-secondary)",
            }}
        >
            {children}
        </button>
    );
}

export default function Toolbar({ editor }) {
    if (!editor) return null;

    return (
        <div
            className="flex items-center gap-0.5 mb-2 p-1 rounded-lg border w-fit"
            style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-secondary)",
            }}
        >
            <ToolbarButton
                title="Negrita (Ctrl+B)"
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
            >
                <Bold size={14} />
            </ToolbarButton>
            <ToolbarButton
                title="Cursiva (Ctrl+I)"
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            >
                <Italic size={14} />
            </ToolbarButton>
            <ToolbarButton
                title="Subrayado (Ctrl+U)"
                active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
                <UnderlineIcon size={14} />
            </ToolbarButton>
        </div>
    );
}
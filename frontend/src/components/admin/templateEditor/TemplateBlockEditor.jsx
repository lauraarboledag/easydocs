import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { VariableNode } from "./VariableNode";
import { DynamicTableNode } from "./TableNode";
import { SectionHeadingNode } from "./SectionHeadingNode";
import { createSlashCommand } from "./SlashCommand";
import Underline from "@tiptap/extension-underline";
import Toolbar from "./Toolbar";
import TextAlign from "@tiptap/extension-text-align";

function extractJinjaKey(rawValue) {
  return rawValue.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "");
}

export default function TemplateBlockEditor({ variables = [] }) {
  const [html, setHtml] = useState("");

  const normalizedVariables = variables.map((v) => ({
    label: v.label,
    jinjaKey: extractJinjaKey(v.value),
  }));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      TextAlign.configure({
        types: ["paragraph"],
      }),
      VariableNode.configure({ variables: normalizedVariables }),
      DynamicTableNode,
      SectionHeadingNode,
      createSlashCommand(normalizedVariables),
    ],
    content: "<p>Escribe / para insertar algo, o empieza a escribir...</p>",
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });


  if (!editor) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">
          Editor visual (borrador — Fase 4)
        </span>
        <span
          className="text-xs px-2 py-1 rounded"
          style={{
            backgroundColor: "var(--color-primary-light)",
            color: "var(--color-primary)",
          }}
        >
          Escribe <strong>/</strong> para insertar
        </span>
      </div>

      <Toolbar editor={editor} />

      <div
        className="border rounded-lg p-4 min-h-[250px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[220px]"
        style={{
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <EditorContent editor={editor} />
      </div>

      <div className="mt-3 p-3 bg-gray-900 text-green-400 text-xs font-mono rounded-lg overflow-x-auto max-h-32">
        {html}
      </div>
    </div>
  );
}

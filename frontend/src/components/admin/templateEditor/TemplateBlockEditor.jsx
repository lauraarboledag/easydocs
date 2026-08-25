import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { VariableNode } from "./VariableNode";
import { useState } from "react";

function extractJinjaKey(rawValue) {
  return rawValue.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "");
}

export default function TemplateBlockEditor({ variables = [] }) {
  const [html, setHtml] = useState("");

  const editor = useEditor({
    extensions: [StarterKit, VariableNode],
    content: "<p>Escribe aquí el contenido de la plantilla...</p>",
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  if (!editor) return null;

  const insertVariable = (label, rawValue) => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "variableChip",
        attrs: { jinjaKey: extractJinjaKey(rawValue), label },
      })
      .run();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">
          Editor visual (borrador — Fase 2)
        </span>
        <select
          onChange={(e) => {
            const variable = variables.find((v) => v.value === e.target.value);
            if (variable) insertVariable(variable.label, variable.value);
            e.target.value = "";
          }}
          className="text-xs border px-2 py-1 rounded font-medium"
          style={{
            borderColor: "var(--color-primary)",
            backgroundColor: "var(--color-primary-light)",
            color: "var(--color-primary)",
          }}
          defaultValue=""
        >
          <option value="" disabled>
            + Insertar variable
          </option>
          {variables.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className="border rounded-lg p-4 min-h-[250px]"
        style={{ borderColor: "var(--border-color)" }}
      >
        <EditorContent editor={editor} />
      </div>

      <div className="mt-3 p-3 bg-gray-900 text-green-400 text-xs font-mono rounded-lg overflow-x-auto max-h-32">
        {html}
      </div>
    </div>
  );
}

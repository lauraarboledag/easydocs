import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { VariableNode } from "./VariableNode";
import { DynamicTableNode } from "./TableNode";
import { SectionHeadingNode } from "./SectionHeadingNode";
import { ParagraphWithLineHeight } from "./LineHeightExtension";
import { createSlashCommand } from "./SlashCommand";
import { compileTemplate } from "./compiler";
import { DataTableNode } from "./DataTableNode";
import { SignatureBlockNode } from "./SignatureBlockNode";
import { ConditionalSectionNode } from "./ConditionalSectionNode";
import Toolbar from "./Toolbar";

// Convierte "{{ nombre_estudiante }}" -> "nombre_estudiante"
function extractJinjaKey(rawValue) {
  return rawValue.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "");
}

export default function TemplateBlockEditor({ variables = [], onReady, initialContent }) {
  const [html, setHtml] = useState("");

  // El editor necesita las variables en formato { jinjaKey, label },
  // no en el formato { label, value: "{{ ... }}" } que usa AdminTemplates.jsx
  const normalizedVariables = variables.map((v) => ({
    label: v.label,
    jinjaKey: extractJinjaKey(v.value),
  }));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, paragraph: false }),
      ParagraphWithLineHeight,
      TextAlign.configure({ types: ["paragraph"] }),
      VariableNode.configure({ variables: normalizedVariables }),
      DynamicTableNode,
      DataTableNode.configure({ variables: normalizedVariables }),
      SectionHeadingNode,
      SignatureBlockNode,
      ConditionalSectionNode,
      createSlashCommand(normalizedVariables),
    ],
    content: initialContent || "<p>Escribe / para insertar algo, o empieza a escribir...</p>",
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  // En vez de exponer un ref con useImperativeHandle (conflictivo con
  // StrictMode + React 19 dentro de Tiptap), avisamos al componente padre
  // pasándole la función de compilación cada vez que el editor cambia.
  useEffect(() => {
    if (!editor) return;
    onReady?.(() => compileTemplate(editor.getJSON()));
  }, [editor]);

  if (!editor) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">
          Editor visual
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
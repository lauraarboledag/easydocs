import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { VariableNode } from "./VariableNode";

// Lista temporal de variables de prueba — en el Paso 2.4 la conectamos
// con el arreglo VARIABLES que ya existe en AdminTemplates.jsx
const TEST_VARIABLES = [
  { label: "Nombre del estudiante", jinjaKey: "nombre_estudiante" },
  { label: "Nombre institución", jinjaKey: "institucion.nombre" },
];

export default function TemplateBlockEditor() {
  const editor = useEditor({
    extensions: [StarterKit, VariableNode],
    content: "<p>Escribe aquí el contenido de la plantilla...</p>",
  });

  if (!editor) return null;

  const insertVariable = (variable) => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "variableChip",
        attrs: { jinjaKey: variable.jinjaKey, label: variable.label },
      })
      .run();
  };

  return (
    <div>
      {/* Barra de herramientas mínima, solo para esta prueba */}
      <div className="flex gap-2 mb-3 p-2 border rounded-lg bg-gray-50">
        {TEST_VARIABLES.map((v) => (
          <button
            key={v.jinjaKey}
            onClick={() => insertVariable(v)}
            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium"
          >
            + {v.label}
          </button>
        ))}
      </div>

      <div className="border rounded-lg p-4 min-h-[200px]">
        <EditorContent editor={editor} />
      </div>

      {/* Solo para que veamos el HTML resultante mientras probamos */}
      <div className="mt-3 p-3 bg-gray-900 text-green-400 text-xs font-mono rounded-lg overflow-x-auto">
        {editor.getHTML()}
      </div>
    </div>
  );
}

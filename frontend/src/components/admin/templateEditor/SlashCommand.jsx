import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import SlashMenu from "./SlashMenu";

function getItems({ query, variables }) {
  const baseItems = [

    {
      title: "Encabezado de sección",
      description: "Título de sección, ej: '1. Identificación'",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .insertContentAt(range, {
            type: "sectionHeading",
            attrs: { level: 2, text: "" },
          })
          .run();
      },
    },

    {
      title: "Tabla dinámica",
      description: "Tabla con columnas configurables, filas automáticas",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .insertContentAt(range, {
            type: "dynamicTable",
            attrs: { columns: ["Columna 1", "Columna 2"] },
          })
          .run();
      },
    },

    {
      title: "Variable",
      description: "Insertar un campo como {{ nombre_estudiante }}",
      command: ({ editor, range }) => {
        const variable = variables[0];
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "variableChip",
            attrs: { jinjaKey: variable.jinjaKey, label: variable.label },
          })
          .run();
      },
    },
  ];

  if (!query) return baseItems;
  return baseItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );
}

export function createSlashCommand(variables) {
  return Extension.create({
    name: "slashCommand",
    priority: 1000,

    addOptions() {
      return {
        suggestion: {
          char: "/",
          command: ({ editor, range, props }) => {
            props.command({ editor, range });
          },
        },
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
          items: ({ query }) => getItems({ query, variables }),
          render: () => {
            let component;
            let popup;

            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashMenu, {
                  props: { items: props.items, command: props.command },
                  editor: props.editor,
                });

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },

              onUpdate(props) {
                component.updateProps({
                  items: props.items,
                  command: props.command,
                });
                popup[0].setProps({ getReferenceClientRect: props.clientRect });
              },

              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }
                return component.ref?.onKeyDown(props) ?? false;
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        }),
      ];
    },
  });
}

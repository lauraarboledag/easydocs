import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
const SlashMenu = forwardRef(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  const selectItem = (index) => {
    const item = items[index];
    if (item) command(item);
  };

  // Esto le permite al padre (la extensión de Tiptap, en el paso 4.3)
  // controlar este menú desde afuera con el teclado
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div
        className="rounded-lg border shadow-lg px-3 py-2 text-xs"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
          color: "var(--text-secondary)",
        }}
      >
        Sin resultados
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border shadow-lg py-1 min-w-[200px]"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      {items.map((item, index) => (
        <button
          key={item.title}
          onClick={() => selectItem(index)}
          className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
          style={{
            backgroundColor:
              index === selectedIndex
                ? "var(--color-primary-light)"
                : "transparent",
            color:
              index === selectedIndex
                ? "var(--color-primary)"
                : "var(--text-primary)",
          }}
        >
          {item.icon}
          <div>
            <p className="font-medium">{item.title}</p>
            {item.description && (
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {item.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
});

SlashMenu.displayName = "SlashMenu";
export default SlashMenu;

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export const THEMES = [
  {
    id: "ocean",
    label: "Océano",
    color: "#1a2b4a",
    description: "El tema clásico de EasyDocs",
  },
  {
    id: "dark",
    label: "Oscuro",
    color: "#0f172a",
    description: "Ideal para uso nocturno",
  },
  {
    id: "forest",
    label: "Bosque",
    color: "#14532d",
    description: "Natural y tranquilo",
  },
  {
    id: "sunset",
    label: "Atardecer",
    color: "#7c2d12",
    description: "Cálido y energético",
  },
  {
    id: "lavender",
    label: "Lavanda",
    color: "#2d1a4a",
    description: "Creativo y suave",
  },
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("easydocs-theme") || "ocean";
  });

  useEffect(() => {
    if (theme === "ocean") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    localStorage.setItem("easydocs-theme", theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

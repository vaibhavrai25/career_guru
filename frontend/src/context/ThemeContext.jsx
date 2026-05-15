import { createContext, useEffect, useMemo, useState } from "react";

export const ThemeContext = createContext({
  darkMode: true,
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

const getInitialTheme = () => {
  if (typeof window === "undefined") return "dark";

  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;

  return prefersDark ? "dark" : "dark";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);

  const darkMode = theme === "dark";

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", darkMode);
    root.dataset.theme = theme;

    localStorage.setItem("theme", theme);
  }, [theme, darkMode]);

  const setTheme = (nextTheme) => {
    if (nextTheme !== "dark" && nextTheme !== "light") return;
    setThemeState(nextTheme);
  };

  const toggleTheme = () => {
    setThemeState((current) => (current === "dark" ? "light" : "dark"));
  };

  const value = useMemo(
    () => ({
      darkMode,
      theme,
      setTheme,
      toggleTheme,
    }),
    [darkMode, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
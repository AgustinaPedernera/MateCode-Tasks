
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem("matecode-theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("matecode-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return { theme, toggleTheme };
}

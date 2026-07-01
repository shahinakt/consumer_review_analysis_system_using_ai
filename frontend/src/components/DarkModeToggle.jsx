import React from "react";
import { HiOutlineSun, HiOutlineMoon } from "react-icons/hi";
import { useTheme } from "../context/ThemeContext.jsx";

export default function DarkModeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="glass w-10 h-10 flex items-center justify-center text-ink-muted hover:text-accent transition-colors"
    >
      {isDark ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
    </button>
  );
}

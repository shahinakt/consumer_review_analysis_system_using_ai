import React from "react";
import DarkModeToggle from "./DarkModeToggle.jsx";

export default function Navbar({ title, subtitle }) {
  return (
    <header className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-base-border/60 bg-base-bg/70 backdrop-blur-xs sticky top-0 z-10">
      <div>
        <h1 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      <DarkModeToggle />
    </header>
  );
}

import React from "react";
import { NavLink } from "react-router-dom";
import {
  HiOutlineChartBar,
  HiOutlineChatAlt2,
  HiOutlineUpload,
  HiOutlineLightBulb,
} from "react-icons/hi";
import { HiOutlineSignal } from "react-icons/hi2";

const links = [
  { to: "/", label: "Dashboard", icon: HiOutlineChartBar },
  { to: "/predict", label: "Predict Review", icon: HiOutlineChatAlt2 },
  { to: "/upload", label: "Upload Reviews", icon: HiOutlineUpload },
  { to: "/recommendations", label: "Recommendations", icon: HiOutlineLightBulb },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 flex-col shrink-0 border-r border-base-border/60 bg-base-surface/40 backdrop-blur-xs">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
          <HiOutlineSignal size={20} />
        </div>
        <span className="font-display font-semibold text-lg tracking-tight">
          PulseBoard
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/5"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-5 text-xs text-ink-faint border-t border-base-border/60">
        Sentiment engine v1.0
        <br />
        Powered by scikit-learn
      </div>
    </aside>
  );
}

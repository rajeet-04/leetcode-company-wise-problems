"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const order: Theme[] = ["light", "dark", "system"];

function applyTheme(theme: Theme) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && systemDark));
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("leet-theme") as Theme | null) ?? "system";
    queueMicrotask(() => setTheme(saved));
    applyTheme(saved);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      if ((localStorage.getItem("leet-theme") ?? "system") === "system") applyTheme("system");
    };
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const cycle = () => {
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    localStorage.setItem("leet-theme", next);
    applyTheme(next);
  };

  return (
    <button
      onClick={cycle}
      className="theme-cycle rounded-full border px-3.5 py-2.5 text-[11px] font-semibold capitalize backdrop-blur"
      aria-label={`Theme: ${theme}. Activate to switch theme.`}
      title={`Theme: ${theme}. Click for ${order[(order.indexOf(theme) + 1) % order.length]}.`}
    >
      {theme}
    </button>
  );
}

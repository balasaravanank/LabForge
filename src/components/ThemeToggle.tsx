"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="icon-action" style={{ width: 34, height: 34 }} aria-label="Toggle theme">
        <div style={{ width: 16, height: 16 }} />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      className="icon-action"
      style={{ width: 34, height: 34 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

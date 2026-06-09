"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "tm-color-mode";

/**
 * Light/Dark toggle. Default is light. Choice persists in localStorage and is
 * also evaluated once before paint via the inline script in <head> to avoid a
 * flash of the wrong palette on reload (see ColorModeScript).
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try { localStorage.setItem(STORAGE_KEY, next ? "dark" : "light"); } catch {}
  }

  if (!mounted) {
    return <div className="h-10 w-10" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

/**
 * Inline script that runs synchronously before first paint to apply the saved
 * color-mode preference. Prevents the dreaded light→dark flash on reload.
 */
export function ColorModeScript() {
  const code = `
(function(){try{
  var k='${STORAGE_KEY}';
  var saved=localStorage.getItem(k);
  if(saved==='dark'){document.documentElement.classList.add('dark');}
}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const light = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark" : "Switch to light"}
      title={light ? "Dark" : "Light"}
      className="inline-flex size-10 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-raised hover:text-fg sm:size-11"
    >
      {light ? <Moon className="size-4" strokeWidth={1.75} /> : <Sun className="size-4" strokeWidth={1.75} />}
    </button>
  );
}

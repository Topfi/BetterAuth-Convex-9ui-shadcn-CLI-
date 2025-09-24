import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme-context";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const handleToggle = () => {
    if (theme === "dark") {
      setTheme("light");
      return;
    }

    setTheme("dark");
  };

  const nextLabel =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={nextLabel}
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

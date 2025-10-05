import { createContext, useContext } from "react";

import type { ThemeBackgroundPattern } from "@/shared/settings/theme";

type Theme = "dark" | "light" | "system";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  backgroundPattern: ThemeBackgroundPattern;
  setBackgroundPattern: (pattern: ThemeBackgroundPattern) => void;
};

const ThemeContext = createContext<ThemeProviderState | null>(null);

function useTheme() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

export { ThemeContext, useTheme };
export type { Theme, ThemeProviderState };

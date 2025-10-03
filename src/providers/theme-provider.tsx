import { useEffect, useState, type ReactNode } from "react";

import {
  ThemeContext,
  type Theme,
  type ThemeProviderState,
} from "./theme-context";
import {
  defaultThemeSettings,
  themeAccentSchema,
  themeBackgroundPatternSchema,
  type ThemeAccent,
  type ThemeBackgroundPattern,
} from "@/shared/settings/theme";
import { ACCENT_TOKENS } from "./theme-accent-tokens";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const patternStorageKey = `${storageKey}:background-pattern`;
  const accentStorageKey = `${storageKey}:accent`;
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    const storedTheme = window.localStorage.getItem(storageKey) as Theme | null;

    return storedTheme ?? defaultTheme;
  });

  const [backgroundPattern, setBackgroundPatternState] =
    useState<ThemeBackgroundPattern>(() => {
      if (typeof window === "undefined") {
        return defaultThemeSettings.backgroundPattern;
      }

      const storedPattern = window.localStorage.getItem(patternStorageKey);
      if (!storedPattern) {
        return defaultThemeSettings.backgroundPattern;
      }

      const parsed = themeBackgroundPatternSchema.safeParse(storedPattern);

      if (parsed.success) {
        return parsed.data;
      }

      window.localStorage.setItem(
        patternStorageKey,
        defaultThemeSettings.backgroundPattern,
      );

      return defaultThemeSettings.backgroundPattern;
    });

  const [accent, setAccentState] = useState<ThemeAccent>(() => {
    if (typeof window === "undefined") {
      return defaultThemeSettings.accent;
    }

    const storedAccent = window.localStorage.getItem(accentStorageKey);
    if (!storedAccent) {
      return defaultThemeSettings.accent;
    }

    const parsed = themeAccentSchema.safeParse(storedAccent);

    if (parsed.success) {
      return parsed.data;
    }

    window.localStorage.setItem(accentStorageKey, defaultThemeSettings.accent);

    return defaultThemeSettings.accent;
  });

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const resolvedTheme = theme === "system" ? getSystemTheme() : theme;

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  }, [theme]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset.backgroundPattern = backgroundPattern;
  }, [backgroundPattern]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.dataset.accent = accent;

    const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
    const tokens = ACCENT_TOKENS[accent][resolvedTheme];

    root.style.setProperty("--accent", tokens.accent);
    root.style.setProperty("--accent-foreground", tokens.accentForeground);
    root.style.setProperty("--ring", tokens.ring);
  }, [accent, theme]);

  useEffect(() => {
    if (typeof window === "undefined" || theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applySystemPreference = (isDark: boolean) => {
      if (typeof document === "undefined") {
        return;
      }

      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(isDark ? "dark" : "light");
    };

    applySystemPreference(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      applySystemPreference(event.matches);
    };

    mediaQuery.addEventListener("change", listener);

    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, [theme]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, nextTheme);
    }
  };

  const setBackgroundPattern = (pattern: ThemeBackgroundPattern) => {
    setBackgroundPatternState(pattern);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(patternStorageKey, pattern);
    }
  };

  const setAccent = (nextAccent: ThemeAccent) => {
    setAccentState(nextAccent);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(accentStorageKey, nextAccent);
    }
  };

  const value: ThemeProviderState = {
    theme,
    setTheme,
    backgroundPattern,
    setBackgroundPattern,
    accent,
    setAccent,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function getSystemTheme(): Exclude<Theme, "system"> {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export { ThemeProvider };

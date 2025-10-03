import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ReactNode, useEffect } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { ThemeProvider } from "@/providers/theme-provider";
import { ACCENT_TOKENS } from "@/providers/theme-accent-tokens";
import { useTheme } from "@/providers/theme-context";
import type {
  ThemeAccent,
  ThemeBackgroundPattern,
} from "@/shared/settings/theme";

type MockMediaQueryList = ReturnType<typeof createMockMediaQueryList>;

describe("ThemeProvider", () => {
  let mediaQueryList: MockMediaQueryList;

  beforeEach(() => {
    mediaQueryList = createMockMediaQueryList();
    window.matchMedia = vi.fn(
      () => mediaQueryList as unknown as MediaQueryList,
    );
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
    delete document.documentElement.dataset.backgroundPattern;
    delete document.documentElement.dataset.accent;
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--accent-foreground");
    document.documentElement.style.removeProperty("--ring");
  });

  afterEach(() => {
    cleanup();
  });

  test("applies system theme derived from media query when no stored theme", () => {
    mediaQueryList.setMatches(true);

    renderWithProvider(<ThemeProbe />);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("theme-value").textContent).toBe("system");
    expect(document.documentElement.dataset.backgroundPattern).toBe("dots");
  });

  test("persists selected theme and updates document classes", () => {
    mediaQueryList.setMatches(false);

    renderWithProvider(<ThemeSetter themeToApply="dark" />);

    fireEvent.click(screen.getByRole("button", { name: "apply theme" }));

    expect(localStorage.getItem("test-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("theme-value").textContent).toBe("dark");
  });

  test("responds to system preference changes while in system mode", () => {
    mediaQueryList.setMatches(false);

    renderWithProvider(<SystemModeWatcher />);

    expect(document.documentElement.classList.contains("light")).toBe(true);

    act(() => mediaQueryList.setMatches(true));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("persists background pattern selection", () => {
    renderWithProvider(<PatternSetter patternToApply="dots" />);

    fireEvent.click(screen.getByRole("button", { name: "apply pattern" }));

    expect(localStorage.getItem("test-theme:background-pattern")).toBe("dots");
    expect(document.documentElement.dataset.backgroundPattern).toBe("dots");
    expect(screen.getByTestId("pattern-value").textContent).toBe("dots");
  });

  test("normalizes legacy background pattern values", () => {
    localStorage.setItem("test-theme:background-pattern", "cross");

    renderWithProvider(<ThemeProbe />);

    expect(document.documentElement.dataset.backgroundPattern).toBe("dots");
    expect(localStorage.getItem("test-theme:background-pattern")).toBe("dots");
  });

  test("persists accent selection and updates CSS variables", () => {
    const accentToApply: ThemeAccent = "emerald";
    const expectedTokens = ACCENT_TOKENS[accentToApply].light;

    renderWithProvider(<AccentSetter accentToApply={accentToApply} />);

    fireEvent.click(screen.getByRole("button", { name: "apply accent" }));

    expect(localStorage.getItem("test-theme:accent")).toBe(accentToApply);
    expect(document.documentElement.dataset.accent).toBe(accentToApply);

    const computed = getComputedStyle(document.documentElement);
    expect(computed.getPropertyValue("--accent").trim()).toBe(
      expectedTokens.accent,
    );
    expect(computed.getPropertyValue("--accent-foreground").trim()).toBe(
      expectedTokens.accentForeground,
    );
    expect(computed.getPropertyValue("--ring").trim()).toBe(
      expectedTokens.ring,
    );
    expect(screen.getByTestId("accent-value").textContent).toBe(accentToApply);
  });

  test("normalizes legacy accent values", () => {
    localStorage.setItem("test-theme:accent", "magenta");

    renderWithProvider(<AccentProbe />);

    expect(document.documentElement.dataset.accent).toBe("blue");
    expect(localStorage.getItem("test-theme:accent")).toBe("blue");
    expect(screen.getByTestId("accent-value").textContent).toBe("blue");
  });
});

type ProbeProps = {
  themeToApply?: "dark" | "light" | "system";
};

function ThemeProbe({ themeToApply }: ProbeProps) {
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    if (themeToApply) {
      setTheme(themeToApply);
    }
  }, [themeToApply, setTheme]);

  return <span data-testid="theme-value">{theme}</span>;
}

function ThemeSetter({
  themeToApply,
}: Required<Pick<ProbeProps, "themeToApply">>) {
  const { setTheme, theme } = useTheme();

  return (
    <>
      <button type="button" onClick={() => setTheme(themeToApply)}>
        apply theme
      </button>
      <span data-testid="theme-value">{theme}</span>
    </>
  );
}

function SystemModeWatcher() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  return <span data-testid="theme-value">system</span>;
}

type PatternSetterProps = {
  patternToApply: ThemeBackgroundPattern;
};

function PatternSetter({ patternToApply }: PatternSetterProps) {
  const { backgroundPattern, setBackgroundPattern } = useTheme();

  return (
    <>
      <button
        type="button"
        onClick={() => setBackgroundPattern(patternToApply)}
      >
        apply pattern
      </button>
      <span data-testid="pattern-value">{backgroundPattern}</span>
    </>
  );
}

type AccentSetterProps = {
  accentToApply: ThemeAccent;
};

function AccentSetter({ accentToApply }: AccentSetterProps) {
  const { accent, setAccent } = useTheme();

  return (
    <>
      <button type="button" onClick={() => setAccent(accentToApply)}>
        apply accent
      </button>
      <span data-testid="accent-value">{accent}</span>
    </>
  );
}

function AccentProbe() {
  const { accent } = useTheme();

  return <span data-testid="accent-value">{accent}</span>;
}

function renderWithProvider(children: ReactNode) {
  return render(
    <ThemeProvider defaultTheme="system" storageKey="test-theme">
      {children}
    </ThemeProvider>,
  );
}

function createMockMediaQueryList() {
  let matches = false;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  return {
    media: "(prefers-color-scheme: dark)",
    get matches() {
      return matches;
    },
    addEventListener: (
      _: "change",
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.add(listener);
    },
    removeEventListener: (
      _: "change",
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.delete(listener);
    },
    dispatchEvent(event: MediaQueryListEvent) {
      listeners.forEach((listener) => listener(event));
      return true;
    },
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

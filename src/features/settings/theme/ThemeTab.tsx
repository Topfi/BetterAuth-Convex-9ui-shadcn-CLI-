import { useLayoutEffect, useMemo, useRef } from "react";
import { useMutation, useQuery } from "convex/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { useTheme } from "@/providers/theme-context";
import { ACCENT_TOKENS } from "@/providers/theme-accent-tokens";
import { api } from "@/convex/api";
import {
  defaultThemeSettings,
  type ThemeAccent,
  type ThemeBackgroundPattern,
  type ThemeMode,
  type ThemeSettings,
} from "@/shared/settings/theme";
import { CircleIcon } from "lucide-react";

let activeThemeTabRoot: HTMLDivElement | null = null;

const markThemeTabInactive = (root: HTMLDivElement) => {
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("data-theme-tab-inactive", "true");
  root.setAttribute("inert", "");
};

const markThemeTabActive = (root: HTMLDivElement) => {
  root.removeAttribute("aria-hidden");
  root.removeAttribute("data-theme-tab-inactive");
  root.removeAttribute("inert");
};

const THEME_OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  description: string;
}> = [
  {
    value: "light",
    label: "Light",
    description: "Bright surfaces optimized for daylight or well-lit rooms.",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Low-light styling with higher contrast and reduced glare.",
  },
];

const PATTERN_OPTIONS: Array<{
  value: ThemeBackgroundPattern;
  label: string;
  description: string;
}> = [
  {
    value: "dots",
    label: "Dots",
    description: "Dotted texture that keeps anchors visible at a glance.",
  },
  {
    value: "lines",
    label: "Lines",
    description: "Horizontal guides for aligning flows and documents.",
  },
  {
    value: "none",
    label: "None",
    description: "Disable background patterns for a distraction-free canvas.",
  },
];

const buildAccentOption = (
  value: ThemeAccent,
  label: string,
  description: string,
) => {
  const tokens = ACCENT_TOKENS[value];
  const swatchGradient = `linear-gradient(135deg, ${tokens.light.accent} 0%, ${tokens.dark.accent} 100%)`;

  return {
    value,
    label,
    description,
    swatchGradient,
    swatchBase: tokens.light.accent,
  };
};

const ACCENT_OPTIONS = [
  buildAccentOption(
    "blue",
    "Azure",
    "Clean blues for a calm workspace and crisp focus states.",
  ),
  buildAccentOption(
    "violet",
    "Violet",
    "Violet accents with a subtle magenta highlight for actions.",
  ),
  buildAccentOption(
    "emerald",
    "Emerald",
    "Green hues that reinforce success messaging and inputs.",
  ),
  buildAccentOption(
    "amber",
    "Amber",
    "Warm amber cues for a friendlier navigation experience.",
  ),
];

export default function ThemeTab() {
  const preferences = useQuery(api.settings_theme.getPreferences, {});
  const updatePreferences = useMutation(api.settings_theme.updatePreferences);
  const { setTheme, setBackgroundPattern, setAccent } = useTheme();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isLoading = preferences === undefined;

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    if (isLoading) {
      if (activeThemeTabRoot === root) {
        activeThemeTabRoot = null;
      }
      markThemeTabInactive(root);
      return;
    }

    if (activeThemeTabRoot && activeThemeTabRoot !== root) {
      markThemeTabInactive(activeThemeTabRoot);
    }

    markThemeTabActive(root);
    activeThemeTabRoot = root;

    return () => {
      if (activeThemeTabRoot === root) {
        activeThemeTabRoot = null;
      }
    };
  }, [isLoading]);

  const updatePreferencesOptimistic = useMemo(
    () =>
      updatePreferences.withOptimisticUpdate((localStore, args) => {
        const previous =
          localStore.getQuery(api.settings_theme.getPreferences, {}) ??
          defaultThemeSettings;
        const merged: ThemeSettings = {
          ...previous,
          mode: args.mode,
          backgroundPattern: args.backgroundPattern,
          accent: args.accent,
        };
        localStore.setQuery(api.settings_theme.getPreferences, {}, merged);
      }),
    [updatePreferences],
  );

  const resolved = preferences ?? defaultThemeSettings;

  const persistPreferences = (next: ThemeSettings) => {
    const previous = resolved;
    setTheme(next.mode);
    setBackgroundPattern(next.backgroundPattern);
    setAccent(next.accent);

    void updatePreferencesOptimistic(next).catch((error) => {
      console.error("[ThemeTab] Failed to update preferences", error);
      setTheme(previous.mode);
      setBackgroundPattern(previous.backgroundPattern);
      setAccent(previous.accent);
      toast.error("Could not save your theme. Try again.");
    });
  };

  const handleModeChange = (nextValue: string) => {
    const nextMode = nextValue as ThemeMode;
    persistPreferences({
      mode: nextMode,
      backgroundPattern: resolved.backgroundPattern,
      accent: resolved.accent,
    });
  };

  const handlePatternChange = (nextValue: string) => {
    const nextPattern = nextValue as ThemeBackgroundPattern;
    persistPreferences({
      mode: resolved.mode,
      backgroundPattern: nextPattern,
      accent: resolved.accent,
    });
  };

  const handleAccentChange = (nextValue: string) => {
    const nextAccent = nextValue as ThemeAccent;
    persistPreferences({
      mode: resolved.mode,
      backgroundPattern: resolved.backgroundPattern,
      accent: nextAccent,
    });
  };

  if (isLoading) {
    return (
      <div
        className="space-y-6"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="space-y-6" data-theme-tab-root>
      <section className="space-y-2">
        <h3 className="text-base font-semibold leading-tight">Theme</h3>
        <p className="text-sm text-muted-foreground">
          Personalize how Hominis looks on this device. Changes apply instantly
          while we sync your preference across other clients.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Appearance</CardTitle>
          <CardDescription>
            Choose a light or dark palette for the interface chrome and
            surfaces.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="radiogroup"
            aria-label="Theme mode"
            className="group grid gap-3 sm:grid-cols-2"
          >
            {THEME_OPTIONS.map((option) => {
              const id = `theme-mode-${option.value}`;
              const inputId = `${id}-input`;
              const labelId = `${id}-label`;
              const descriptionId = `${id}-description`;
              return (
                <div key={option.value} className="contents">
                  <Label
                    htmlFor={inputId}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors duration-150 hover:border-ring/70 focus-visible:outline-none focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-offset-2 focus-within:ring-offset-background has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
                  >
                    <input
                      id={inputId}
                      className="peer sr-only"
                      type="radio"
                      name="theme-mode"
                      value={option.value}
                      checked={resolved.mode === option.value}
                      onChange={() => handleModeChange(option.value)}
                      onClick={() => {
                        if (resolved.mode === option.value) {
                          handleModeChange(option.value);
                        }
                      }}
                      aria-labelledby={labelId}
                      aria-describedby={descriptionId}
                    />
                    <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background transition-colors duration-150 peer-checked:border-primary">
                      <CircleIcon className="size-2 fill-primary text-primary opacity-0 transition-opacity duration-150 peer-checked:opacity-100" />
                    </span>
                    <div className="space-y-1">
                      <span id={labelId} className="text-sm font-medium">
                        {option.label}
                      </span>
                      <p
                        id={descriptionId}
                        className="text-sm text-muted-foreground"
                      >
                        {option.description}
                      </p>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Background pattern
          </CardTitle>
          <CardDescription>
            Align to canvas guides or disable them when you need a blank slate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="radiogroup"
            aria-label="Background pattern"
            className="group grid gap-3 sm:grid-cols-2"
          >
            {PATTERN_OPTIONS.map((option) => {
              const id = `theme-pattern-${option.value}`;
              const inputId = `${id}-input`;
              const labelId = `${id}-label`;
              const descriptionId = `${id}-description`;
              return (
                <div key={option.value} className="contents">
                  <Label
                    htmlFor={inputId}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors duration-150 hover:border-ring/70 focus-visible:outline-none focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-offset-2 focus-within:ring-offset-background has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
                  >
                    <input
                      id={inputId}
                      className="peer sr-only"
                      type="radio"
                      name="theme-pattern"
                      value={option.value}
                      checked={resolved.backgroundPattern === option.value}
                      onChange={() => handlePatternChange(option.value)}
                      onClick={() => {
                        if (resolved.backgroundPattern === option.value) {
                          handlePatternChange(option.value);
                        }
                      }}
                      aria-labelledby={labelId}
                      aria-describedby={descriptionId}
                    />
                    <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background transition-colors duration-150 peer-checked:border-primary">
                      <CircleIcon className="size-2 fill-primary text-primary opacity-0 transition-opacity duration-150 peer-checked:opacity-100" />
                    </span>
                    <div className="space-y-1">
                      <span id={labelId} className="text-sm font-medium">
                        {option.label}
                      </span>
                      <p
                        id={descriptionId}
                        className="text-sm text-muted-foreground"
                      >
                        {option.description}
                      </p>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Accent color</CardTitle>
          <CardDescription>
            Set the highlight color for focus states, selections, and subtle
            surfaces.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="radiogroup"
            aria-label="Accent color"
            className="group grid gap-3 sm:grid-cols-2"
          >
            {ACCENT_OPTIONS.map((option) => {
              const id = `theme-accent-${option.value}`;
              const inputId = `${id}-input`;
              const labelId = `${id}-label`;
              const descriptionId = `${id}-description`;
              return (
                <div key={option.value} className="contents">
                  <Label
                    htmlFor={inputId}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors duration-150 hover:border-ring/70 focus-visible:outline-none focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-offset-2 focus-within:ring-offset-background has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
                  >
                    <input
                      id={inputId}
                      className="peer sr-only"
                      type="radio"
                      name="theme-accent"
                      value={option.value}
                      checked={resolved.accent === option.value}
                      onChange={() => handleAccentChange(option.value)}
                      onClick={() => {
                        if (resolved.accent === option.value) {
                          handleAccentChange(option.value);
                        }
                      }}
                      aria-labelledby={labelId}
                      aria-describedby={descriptionId}
                    />
                    <span
                      className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-md border border-input bg-background transition-colors duration-150"
                      style={{
                        backgroundImage: option.swatchGradient,
                        backgroundColor: option.swatchBase,
                      }}
                    >
                      <span className="sr-only">{option.label}</span>
                    </span>
                    <div className="space-y-1">
                      <span id={labelId} className="text-sm font-medium">
                        {option.label}
                      </span>
                      <p
                        id={descriptionId}
                        className="text-sm text-muted-foreground"
                      >
                        {option.description}
                      </p>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { useTheme } from "@/providers/theme-context";
import { api } from "@/convex/api";
import {
  defaultThemeSettings,
  type ThemeBackgroundPattern,
  type ThemeMode,
  type ThemeSettings,
} from "@/shared/settings/theme";

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
    value: "cross",
    label: "Cross",
    description: "Subtle crosshatch grid ideal for mapping workspace layouts.",
  },
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

export default function ThemeTab() {
  const preferences = useQuery(api.settings_theme.getPreferences, {});
  const updatePreferences = useMutation(api.settings_theme.updatePreferences);
  const { setTheme, setBackgroundPattern } = useTheme();

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
        };
        localStore.setQuery(api.settings_theme.getPreferences, {}, merged);
      }),
    [updatePreferences],
  );

  const resolved = preferences ?? defaultThemeSettings;
  const isLoading = preferences === undefined;

  const persistPreferences = (next: ThemeSettings) => {
    const previous = resolved;
    setTheme(next.mode);
    setBackgroundPattern(next.backgroundPattern);

    void updatePreferencesOptimistic(next).catch((error) => {
      console.error("[ThemeTab] Failed to update preferences", error);
      setTheme(previous.mode);
      setBackgroundPattern(previous.backgroundPattern);
      toast.error("Could not save your theme. Try again.");
    });
  };

  const handleModeChange = (nextValue: string) => {
    const nextMode = nextValue as ThemeMode;
    if (nextMode === resolved.mode) {
      setTheme(nextMode);
      return;
    }

    persistPreferences({
      mode: nextMode,
      backgroundPattern: resolved.backgroundPattern,
    });
  };

  const handlePatternChange = (nextValue: string) => {
    const nextPattern = nextValue as ThemeBackgroundPattern;
    if (nextPattern === resolved.backgroundPattern) {
      setBackgroundPattern(nextPattern);
      return;
    }

    persistPreferences({
      mode: resolved.mode,
      backgroundPattern: nextPattern,
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
    <div className="space-y-6">
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
          <RadioGroup
            value={resolved.mode}
            onValueChange={handleModeChange}
            className="grid gap-3 sm:grid-cols-2"
          >
            {THEME_OPTIONS.map((option) => {
              const id = `theme-mode-${option.value}`;
              return (
                <div
                  key={option.value}
                  className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      id={id}
                      value={option.value}
                      aria-describedby={`${id}-description`}
                    />
                    <div className="space-y-1">
                      <Label htmlFor={id} className="text-sm font-medium">
                        {option.label}
                      </Label>
                      <p
                        id={`${id}-description`}
                        className="text-sm text-muted-foreground"
                      >
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
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
          <RadioGroup
            value={resolved.backgroundPattern}
            onValueChange={handlePatternChange}
            className="grid gap-3 sm:grid-cols-2"
          >
            {PATTERN_OPTIONS.map((option) => {
              const id = `theme-pattern-${option.value}`;
              return (
                <div
                  key={option.value}
                  className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      id={id}
                      value={option.value}
                      aria-describedby={`${id}-description`}
                    />
                    <div className="space-y-1">
                      <Label htmlFor={id} className="text-sm font-medium">
                        {option.label}
                      </Label>
                      <p
                        id={`${id}-description`}
                        className="text-sm text-muted-foreground"
                      >
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

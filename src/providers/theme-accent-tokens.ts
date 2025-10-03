import type { ThemeAccent } from "@/shared/settings/theme";

type AccentDefinition = {
  accent: string;
  accentForeground: string;
  ring: string;
};

type AccentTokenMap = Record<
  ThemeAccent,
  {
    light: AccentDefinition;
    dark: AccentDefinition;
  }
>;

export const ACCENT_TOKENS: AccentTokenMap = {
  blue: {
    light: {
      accent: "oklch(91% 0.09 240.61)",
      accentForeground: "oklch(34% 0.12 241.65)",
      ring: "oklch(68% 0.12 241.65)",
    },
    dark: {
      accent: "oklch(41% 0.16 244.34)",
      accentForeground: "oklch(96% 0.03 240.4)",
      ring: "oklch(58% 0.14 243.9)",
    },
  },
  violet: {
    light: {
      accent: "oklch(90% 0.1 303.43)",
      accentForeground: "oklch(36% 0.13 303.43)",
      ring: "oklch(66% 0.13 303.43)",
    },
    dark: {
      accent: "oklch(43% 0.18 302.72)",
      accentForeground: "oklch(96% 0.03 302.72)",
      ring: "oklch(60% 0.16 302.72)",
    },
  },
  emerald: {
    light: {
      accent: "oklch(91% 0.09 160.72)",
      accentForeground: "oklch(32% 0.09 160.72)",
      ring: "oklch(66% 0.1 160.72)",
    },
    dark: {
      accent: "oklch(39% 0.14 158.5)",
      accentForeground: "oklch(94% 0.03 158.5)",
      ring: "oklch(55% 0.13 158.5)",
    },
  },
  amber: {
    light: {
      accent: "oklch(94% 0.12 82.74)",
      accentForeground: "oklch(38% 0.12 82.74)",
      ring: "oklch(72% 0.12 82.74)",
    },
    dark: {
      accent: "oklch(52% 0.16 82.74)",
      accentForeground: "oklch(96% 0.03 82.74)",
      ring: "oklch(66% 0.15 82.74)",
    },
  },
};

export type { AccentDefinition, AccentTokenMap };

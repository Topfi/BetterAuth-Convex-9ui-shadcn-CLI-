import { z } from "zod";

export const themeModeSchema = z.enum(["light", "dark"]);
export type ThemeMode = z.infer<typeof themeModeSchema>;

export const themeBackgroundPatternSchema = z.enum(["dots", "lines", "none"]);
export type ThemeBackgroundPattern = z.infer<
  typeof themeBackgroundPatternSchema
>;

export const themeAccentSchema = z.enum(["blue", "violet", "emerald", "amber"]);
export type ThemeAccent = z.infer<typeof themeAccentSchema>;

export const themeSettingsSchema = z.object({
  mode: themeModeSchema,
  backgroundPattern: themeBackgroundPatternSchema,
  accent: themeAccentSchema,
});
export type ThemeSettings = z.infer<typeof themeSettingsSchema>;

export const themeSettingsUpdateSchema = themeSettingsSchema;
export type ThemeSettingsUpdate = z.infer<typeof themeSettingsUpdateSchema>;

export const themeSettingsDocumentSchema = themeSettingsSchema.extend({
  identitySubject: z.string(),
  updatedAt: z.number(),
});
export type ThemeSettingsDocument = z.infer<typeof themeSettingsDocumentSchema>;

export const defaultThemeSettings: ThemeSettings = {
  mode: "light",
  backgroundPattern: "dots",
  accent: "blue",
};

export const sanitizeThemeSettings = (value: {
  mode: unknown;
  backgroundPattern: unknown;
  accent?: unknown;
}): ThemeSettings => {
  const mode = themeModeSchema.safeParse(value.mode);
  const pattern = themeBackgroundPatternSchema.safeParse(
    value.backgroundPattern,
  );
  const accent = themeAccentSchema.safeParse(value.accent);

  return {
    mode: mode.success ? mode.data : defaultThemeSettings.mode,
    backgroundPattern: pattern.success
      ? pattern.data
      : defaultThemeSettings.backgroundPattern,
    accent: accent.success ? accent.data : defaultThemeSettings.accent,
  };
};

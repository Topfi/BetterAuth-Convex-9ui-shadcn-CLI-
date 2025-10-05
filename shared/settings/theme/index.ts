import { z } from "zod";

export const themeModeSchema = z.enum(["light", "dark"]);
export type ThemeMode = z.infer<typeof themeModeSchema>;

export const themeBackgroundPatternSchema = z.enum([
  "cross",
  "dots",
  "lines",
  "none",
]);
export type ThemeBackgroundPattern = z.infer<
  typeof themeBackgroundPatternSchema
>;

export const themeSettingsSchema = z.object({
  mode: themeModeSchema,
  backgroundPattern: themeBackgroundPatternSchema,
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
  backgroundPattern: "cross",
};

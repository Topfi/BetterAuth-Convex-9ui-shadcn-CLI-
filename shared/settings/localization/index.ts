import { z } from "zod";

const timeZoneValueSchema = z
  .string()
  .min(1)
  .refine((value) => isValidTimeZone(value), {
    message: "Invalid IANA time zone identifier",
  });

export const localizationTimeZoneSchema = z.union([
  z.literal("system"),
  timeZoneValueSchema,
]);
export type LocalizationTimeZone = z.infer<typeof localizationTimeZoneSchema>;

export const localizationDateFormatSchema = z.enum([
  "system",
  "dayMonthYear",
  "monthDayYear",
  "iso8601",
]);
export type LocalizationDateFormat = z.infer<
  typeof localizationDateFormatSchema
>;

export const localizationTimeFormatSchema = z.enum([
  "system",
  "twelveHour",
  "twentyFourHour",
]);
export type LocalizationTimeFormat = z.infer<
  typeof localizationTimeFormatSchema
>;

export const localizationLanguageSchema = z.enum(["en"]);
export type LocalizationLanguage = z.infer<typeof localizationLanguageSchema>;

export const localizationSettingsSchema = z.object({
  timeZone: localizationTimeZoneSchema,
  dateFormat: localizationDateFormatSchema,
  timeFormat: localizationTimeFormatSchema,
  showSeconds: z.boolean(),
  language: localizationLanguageSchema,
});
export type LocalizationSettings = z.infer<typeof localizationSettingsSchema>;

export const localizationSettingsUpdateSchema = localizationSettingsSchema;
export type LocalizationSettingsUpdate = z.infer<
  typeof localizationSettingsUpdateSchema
>;

export const defaultLocalizationSettings: LocalizationSettings = {
  timeZone: "system",
  dateFormat: "system",
  timeFormat: "system",
  showSeconds: true,
  language: "en",
};

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

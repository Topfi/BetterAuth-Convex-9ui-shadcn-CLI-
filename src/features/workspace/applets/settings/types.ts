export type SettingsTabId =
  | "general"
  | "theme"
  | "localization"
  | "profile"
  | "privacy";

export type SettingsLaunchCommand = {
  tab: SettingsTabId;
  requestId: number;
} | null;

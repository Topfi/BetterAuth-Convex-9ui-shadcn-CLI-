import { useContext } from "react";

import { SettingsLaunchContext } from "./context";
import type { SettingsLaunchCommand } from "./types";

export const useSettingsLaunchCommand = (): SettingsLaunchCommand => {
  return useContext(SettingsLaunchContext);
};

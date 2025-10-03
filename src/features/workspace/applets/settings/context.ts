import { createContext } from "react";

import type { SettingsLaunchCommand } from "./types";

export const SettingsLaunchContext = createContext<SettingsLaunchCommand>(null);

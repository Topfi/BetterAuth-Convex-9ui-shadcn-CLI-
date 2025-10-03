import type { ReactNode } from "react";

import { SettingsLaunchContext } from "./context";
import type { SettingsLaunchCommand } from "./types";

export const SettingsLaunchProvider = ({
  value,
  children,
}: {
  value: SettingsLaunchCommand;
  children: ReactNode;
}) => (
  <SettingsLaunchContext.Provider value={value}>
    {children}
  </SettingsLaunchContext.Provider>
);

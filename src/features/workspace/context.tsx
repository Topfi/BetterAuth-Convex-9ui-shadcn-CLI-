import { createContext, type ReactNode, useContext } from "react";

import type { AppletNodeData } from "./types";

type AppletNodeContextValue = {
  nodeId: string;
  data: AppletNodeData;
};

const AppletNodeContext = createContext<AppletNodeContextValue | null>(null);

export function AppletNodeContextProvider({
  value,
  children,
}: {
  value: AppletNodeContextValue;
  children: ReactNode;
}) {
  return (
    <AppletNodeContext.Provider value={value}>
      {children}
    </AppletNodeContext.Provider>
  );
}

export function useAppletNodeContext(): AppletNodeContextValue | null {
  return useContext(AppletNodeContext);
}

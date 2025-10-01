import { Megaphone } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { StandupPrepApplet } from "./StandupPrepApplet";

export const standupPrepApplet: WorkspaceApplet = {
  id: "standup_prep",
  name: "Standup Prep",
  description: "Keep your daily update razor-sharp and clipboard-ready.",
  icon: Megaphone,
  Component: StandupPrepApplet,
  minSize: {
    width: 360,
    height: 320,
  },
};

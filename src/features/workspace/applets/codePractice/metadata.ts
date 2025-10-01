import { Braces } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { CodePracticeApplet } from "./CodePracticeApplet";

export const codePracticeApplet: WorkspaceApplet = {
  id: "codePractice",
  name: "Code Practice Lab",
  description: "Curate CS drills that pair well with clinical coursework.",
  icon: Braces,
  Component: CodePracticeApplet,
  minSize: {
    width: 420,
    height: 520,
  },
};

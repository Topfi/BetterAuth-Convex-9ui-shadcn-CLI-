import { Code } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { CodingConceptsApplet } from "./CodingConceptsApplet";

export const codingConceptsApplet: WorkspaceApplet = {
  id: "coding_concepts",
  name: "Coding Concepts",
  description: "Reference core algorithm patterns with bite-sized reminders.",
  icon: Code,
  Component: CodingConceptsApplet,
  minSize: {
    width: 360,
    height: 280,
  },
};

import { Stethoscope } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { MedFlashcardsApplet } from "./MedFlashcardsApplet";

export const medFlashcardsApplet: WorkspaceApplet = {
  id: "medFlashcards",
  name: "Med Flashcards",
  description: "Rapid-fire systems review built for white coat sprints.",
  icon: Stethoscope,
  Component: MedFlashcardsApplet,
  minSize: {
    width: 360,
    height: 520,
  },
};

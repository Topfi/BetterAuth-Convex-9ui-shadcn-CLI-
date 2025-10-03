import { Brain } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { MedFlashcardsApplet } from "./MedFlashcardsApplet";

export const medFlashcardsApplet: WorkspaceApplet = {
  id: "med_flashcards",
  name: "Med Flashcards",
  description: "Quick recall prompts for high-yield clinical facts.",
  icon: Brain,
  Component: MedFlashcardsApplet,
  minSize: {
    width: 320,
    height: 280,
  },
};

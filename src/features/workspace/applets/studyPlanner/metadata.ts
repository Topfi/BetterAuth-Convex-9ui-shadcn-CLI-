import { CalendarClock } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { StudyPlannerApplet } from "./StudyPlannerApplet";

export const studyPlannerApplet: WorkspaceApplet = {
  id: "studyPlanner",
  name: "Study Planner",
  description: "Layer med labs and coding sprints into a single weekly plan.",
  icon: CalendarClock,
  Component: StudyPlannerApplet,
  minSize: {
    width: 360,
    height: 480,
  },
};

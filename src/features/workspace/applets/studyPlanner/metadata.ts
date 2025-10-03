import { CalendarCheck } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { StudyPlannerApplet } from "./StudyPlannerApplet";

export const studyPlannerApplet: WorkspaceApplet = {
  id: "study_planner",
  name: "Study Planner",
  description: "Track deadlines and balance workloads across classes.",
  icon: CalendarCheck,
  Component: StudyPlannerApplet,
  minSize: {
    width: 360,
    height: 320,
  },
};

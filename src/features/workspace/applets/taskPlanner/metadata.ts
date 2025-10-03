import { ListChecks } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { TaskPlannerApplet } from "./TaskPlannerApplet";

export const taskPlannerApplet: WorkspaceApplet = {
  id: "taskPlanner",
  name: "Task Planner",
  description: "Trim your backlog, track energy, and celebrate wins inline.",
  icon: ListChecks,
  Component: TaskPlannerApplet,
  minSize: {
    width: 320,
    height: 360,
  },
};

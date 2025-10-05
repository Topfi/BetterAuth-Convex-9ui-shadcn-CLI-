import { Flame } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { HabitTrackerApplet } from "./HabitTrackerApplet";

export const habitTrackerApplet: WorkspaceApplet = {
  id: "habit_tracker",
  name: "Habit Tracker",
  description: "Track streaks across the week and celebrate tiny wins.",
  icon: Flame,
  Component: HabitTrackerApplet,
  minSize: {
    width: 360,
    height: 320,
  },
};

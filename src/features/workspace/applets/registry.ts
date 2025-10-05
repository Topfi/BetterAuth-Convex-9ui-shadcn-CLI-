import React from "react";
import { Bot } from "lucide-react";

import {
  GeneratedAppletRunner,
  type GeneratedAppletId,
} from "./generated/GeneratedAppletRunner";
import { counterApplet } from "./counter";
import { codePracticeApplet } from "./codePractice";
import { focusTimerApplet } from "./focusTimer";
import { generatorApplet } from "./generator";
import { habitTrackerApplet } from "./habitTracker";
import { helloWorldApplet } from "./helloWorld";
import { medFlashcardsApplet } from "./medFlashcards";
import { standupPrepApplet } from "./standupPrep";
import { settingsApplet } from "./settings";
import { studyPlannerApplet } from "./studyPlanner";
import type { WorkspaceApplet } from "./types";

const APPLETS: WorkspaceApplet[] = [
  settingsApplet,
  helloWorldApplet,
  studyPlannerApplet,
  medFlashcardsApplet,
  codePracticeApplet,
  standupPrepApplet,
  focusTimerApplet,
  habitTrackerApplet,
  generatorApplet,
  counterApplet,
];

const APPLETS_MAP = new Map(APPLETS.map((applet) => [applet.id, applet]));

export const workspaceApplets = APPLETS;

export const GENERATED_PREFIX = "generated/";

const createGeneratedComponent = (appletId: GeneratedAppletId) => () =>
  React.createElement(GeneratedAppletRunner, { appletId });

export function getWorkspaceApplet(id: string): WorkspaceApplet | null {
  const applet = APPLETS_MAP.get(id);
  if (applet) return applet;

  if (id.startsWith(GENERATED_PREFIX)) {
    const appletDocId = id.slice(GENERATED_PREFIX.length) as GeneratedAppletId;
    return {
      id,
      name: "Generated Applet",
      icon: Bot,
      minSize: { width: 360, height: 260 },
      Component: createGeneratedComponent(appletDocId),
    } satisfies WorkspaceApplet;
  }

  return null;
}

export { settingsApplet, generatorApplet };

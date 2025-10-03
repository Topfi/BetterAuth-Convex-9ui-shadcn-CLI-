import { codingConceptsApplet } from "./codingConcepts";
import { counterApplet } from "./counter";
import { generatorEvalApplet } from "./generatorEval";
import { helloWorldApplet } from "./helloWorld";
import { medFlashcardsApplet } from "./medFlashcards";
import { generatorApplet } from "./generator";
import { settingsApplet } from "./settings";
import { studyPlannerApplet } from "./studyPlanner";
import type { WorkspaceApplet } from "./types";

const generatorAppletLegacy: WorkspaceApplet = {
  ...generatorApplet,
  id: "gpt5_chat",
};

const APPLETS: WorkspaceApplet[] = [
  settingsApplet,
  studyPlannerApplet,
  medFlashcardsApplet,
  codingConceptsApplet,
  helloWorldApplet,
  generatorEvalApplet,
  generatorApplet,
  generatorAppletLegacy,
  counterApplet,
];

const APPLET_LOOKUP = new Map(APPLETS.map((applet) => [applet.id, applet]));

export const workspaceApplets = APPLETS;

export const getWorkspaceApplet = (id: string): WorkspaceApplet | undefined =>
  APPLET_LOOKUP.get(id);

export { settingsApplet };

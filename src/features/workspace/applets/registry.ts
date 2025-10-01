import { counterApplet } from "./counter";
import { generatorEvalApplet } from "./generatorEval";
import type { WorkspaceApplet } from "./types";
import { helloWorldApplet } from "./helloWorld";
import { settingsApplet } from "./settings";

const APPLETS: WorkspaceApplet[] = [
  settingsApplet,
  helloWorldApplet,
  generatorEvalApplet,
  counterApplet,
];

const APPLET_LOOKUP = new Map(APPLETS.map((applet) => [applet.id, applet]));

export const workspaceApplets = APPLETS;

export const getWorkspaceApplet = (id: string): WorkspaceApplet | undefined =>
  APPLET_LOOKUP.get(id);

export { settingsApplet };

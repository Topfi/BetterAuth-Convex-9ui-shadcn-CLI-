import { Code2 } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { GeneratorEvalApplet } from "./GeneratorEvalApplet";

export const generatorEvalApplet: WorkspaceApplet = {
  id: "generator_eval",
  name: "Generator Eval",
  icon: Code2,
  Component: GeneratorEvalApplet,
  minSize: {
    width: 320,
    height: 240,
  },
};

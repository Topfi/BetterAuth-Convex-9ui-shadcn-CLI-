import { Sparkles } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { GeneratorApplet } from "./GeneratorApplet";

export const generatorApplet: WorkspaceApplet = {
  id: "generator",
  name: "Generator",
  icon: Sparkles,
  Component: GeneratorApplet,
  description: "Describe a tool and stream runnable JSX into the workspace.",
  minSize: {
    width: 380,
    height: 360,
  },
  allowMultipleInstances: true,
};

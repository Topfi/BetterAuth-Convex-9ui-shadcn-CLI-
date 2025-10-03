import { Boxes } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { GeneratorApplet } from "./GeneratorApplet";

export const generatorApplet: WorkspaceApplet = {
  id: "generator",
  name: "Generator",
  icon: Boxes,
  Component: GeneratorApplet,
  minSize: {
    width: 1920,
    height: 1080,
  },
};


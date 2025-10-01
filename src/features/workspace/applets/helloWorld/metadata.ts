import { Sparkles } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { HelloWorldApplet } from "./HelloWorldApplet";

export const helloWorldApplet: WorkspaceApplet = {
  id: "hello_world",
  name: "Hello World",
  icon: Sparkles,
  Component: HelloWorldApplet,
  minSize: {
    width: 240,
    height: 160,
  },
};

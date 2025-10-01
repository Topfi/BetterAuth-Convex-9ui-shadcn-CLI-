import { Gauge } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { CounterApplet } from "./CounterApplet";

export const counterApplet: WorkspaceApplet = {
  id: "counter",
  name: "Counter",
  icon: Gauge,
  Component: CounterApplet,
  minSize: {
    width: 240,
    height: 160,
  },
};

// Shared types and constants for applet transform synchronization.

export type AppletTransformAction = {
  timeSinceBatchStart: number;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number };
};

export type AppletTransformBatch = AppletTransformAction[];

// Sampling at ~60fps and batching to ~10Hz updates.
export const SAMPLING_INTERVAL_MS = 16;
export const BATCH_INTERVAL_MS = 100;


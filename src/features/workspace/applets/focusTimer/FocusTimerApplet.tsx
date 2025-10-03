import { useEffect, useState } from "react";

const PRESETS = [
  { id: "focus", label: "Focus", minutes: 25 },
  { id: "deep", label: "Deep Work", minutes: 50 },
  { id: "break", label: "Reset", minutes: 10 },
] as const;

export function FocusTimerApplet() {
  const [minutes, setMinutes] = useState(PRESETS[0].minutes);
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    PRESETS[0].minutes * 60,
  );
  const [activePreset, setActivePreset] = useState<string>(PRESETS[0].id);

  const totalSeconds = minutes * 60;
  const progress = totalSeconds
    ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds))
    : 0;

  useEffect(() => {
    setRemainingSeconds(minutes * 60);
    setIsRunning(false);
  }, [minutes]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          setIsRunning(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  const minutesPart = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secondsPart = (remainingSeconds % 60).toString().padStart(2, "0");
  const formattedTime = `${minutesPart}:${secondsPart}`;

  return (
    <div className="flex h-full flex-col gap-5 p-4 text-sm">
      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-amber-100/60 via-background to-background p-4 shadow-sm dark:from-amber-500/10">
        <div className="flex justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Focus Timer</h2>
            <p className="text-xs text-muted-foreground">
              Pick a cadence, press start, and stay in flow without leaving the
              workspace.
            </p>
          </div>
          <span
            aria-live="polite"
            className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium"
          >
            {isRunning
              ? "In session"
              : remainingSeconds === 0
                ? "Complete"
                : "Idle"}
          </span>
        </div>
        <div className="mt-5 grid place-items-center">
          <div
            className="relative grid h-40 w-40 place-items-center rounded-full"
            style={{
              backgroundImage: `conic-gradient(hsl(var(--primary)) ${
                progress * 360
              }deg, hsl(var(--muted)) ${progress * 360}deg)`,
            }}
          >
            <div className="grid h-32 w-32 place-items-center rounded-full bg-background text-3xl font-semibold">
              {formattedTime}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/60 px-4 py-3">
        <fieldset className="flex flex-wrap gap-2" aria-label="Timer presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setMinutes(preset.minutes);
                setActivePreset(preset.id);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activePreset === preset.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border"
              }`}
            >
              {preset.label} · {preset.minutes}m
            </button>
          ))}
        </fieldset>
        <label className="flex flex-col gap-2 text-xs font-medium">
          Custom length
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={minutes}
              onChange={(event) => {
                setActivePreset("custom");
                setMinutes(Number(event.target.value));
              }}
              className="h-2 flex-1 appearance-none rounded-full bg-muted"
            />
            <span className="w-12 text-right text-xs text-muted-foreground">
              {minutes}m
            </span>
          </div>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => {
              if (isRunning) {
                setIsRunning(false);
                return;
              }
              if (remainingSeconds === 0) {
                setRemainingSeconds(totalSeconds);
              }
              setIsRunning(true);
            }}
          >
            {isRunning ? "Pause" : remainingSeconds === 0 ? "Restart" : "Start"}
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => {
              setIsRunning(false);
              setRemainingSeconds(totalSeconds);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

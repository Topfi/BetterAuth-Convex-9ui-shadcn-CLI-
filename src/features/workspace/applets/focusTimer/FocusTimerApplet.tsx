import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider, SliderValue } from "@/components/ui/slider";

const QUICK_PRESETS = [15, 25, 50];

const MS_IN_MINUTE = 60_000;

const formatTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.round(ms / 1_000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export function FocusTimerApplet() {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(
    () => durationMinutes * MS_IN_MINUTE,
  );
  const intervalRef = useRef<number | null>(null);

  const totalMs = durationMinutes * MS_IN_MINUTE;
  const progress =
    totalMs === 0 ? 0 : ((totalMs - remainingMs) / totalMs) * 100;

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setRemainingMs((current) => Math.max(0, current - 1_000));
    }, 1_000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (remainingMs === 0 && isRunning) {
      setIsRunning(false);
    }
  }, [isRunning, remainingMs]);

  useEffect(() => {
    if (!isRunning) {
      setRemainingMs(durationMinutes * MS_IN_MINUTE);
    }
  }, [durationMinutes, isRunning]);

  const handlePresetClick = (minutes: number) => {
    setDurationMinutes(minutes);
  };

  const handleSliderChange = (value: number[]) => {
    const [minutes] = value;
    setDurationMinutes(minutes);
  };

  const handleToggle = () => {
    if (remainingMs === 0) {
      setRemainingMs(durationMinutes * MS_IN_MINUTE);
    }
    setIsRunning((current) => !current);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingMs(durationMinutes * MS_IN_MINUTE);
  };

  const handleAddMinute = () => {
    setDurationMinutes((current) => Math.min(90, current + 5));
  };

  const handleSubtractMinute = () => {
    setDurationMinutes((current) => Math.max(5, current - 5));
  };

  const statusLabel =
    remainingMs === 0 ? "Session complete" : isRunning ? "In session" : "Ready";

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle>Focus Timer</CardTitle>
        <CardDescription>
          Structure deep work bursts with mindful breaks—stay in flow without
          watching the clock.
        </CardDescription>
        <Badge
          variant={
            isRunning ? "success" : remainingMs === 0 ? "info" : "secondary"
          }
        >
          {statusLabel}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Remaining
            </p>
            <p
              className="font-semibold text-5xl tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatTime(remainingMs)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSubtractMinute}
              disabled={isRunning || durationMinutes <= 5}
            >
              -5m
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMinute}
              disabled={isRunning || durationMinutes >= 90}
            >
              +5m
            </Button>
          </div>
        </div>

        <div>
          <Slider
            min={5}
            max={90}
            step={5}
            value={[durationMinutes]}
            onValueChange={handleSliderChange}
            disabled={isRunning}
            aria-label="Session length in minutes"
          >
            <SliderValue>{durationMinutes} minute session</SliderValue>
          </Slider>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {QUICK_PRESETS.map((minutes) => (
            <Button
              key={minutes}
              type="button"
              variant={minutes === durationMinutes ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePresetClick(minutes)}
              disabled={isRunning}
            >
              {minutes} min
            </Button>
          ))}
        </div>

        <div className="mt-auto space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-muted-foreground text-xs" aria-live="polite">
            {remainingMs === 0
              ? "Great job—take a breather before your next session."
              : isRunning
                ? "Timer locked in. Stay focused until the chime."
                : "Press start when you are ready to focus."}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        <Button type="button" onClick={handleToggle} className="flex-1">
          {isRunning ? "Pause" : remainingMs === 0 ? "Restart" : "Start"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleReset}
          disabled={remainingMs === totalMs && !isRunning}
        >
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
}

import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const FOCUS_TYPES = [
  "Exam prep",
  "Lab review",
  "Project build",
  "Reading sprint",
] as const;
const TIME_WINDOWS = ["Today", "Tomorrow", "This week"] as const;

type FocusType = (typeof FOCUS_TYPES)[number];
type TimeWindow = (typeof TIME_WINDOWS)[number];

type StudySession = {
  id: string;
  topic: string;
  notes: string;
  focus: FocusType;
  window: TimeWindow;
  durationMinutes: number;
  status: "planned" | "completed";
};

const defaultSessions: StudySession[] = [
  {
    id: "session-anat",
    topic: "Anatomy atlas review",
    focus: "Reading sprint",
    window: "Today",
    durationMinutes: 45,
    notes: "Build a quick checklist for cranial nerves before lab quiz.",
    status: "planned",
  },
  {
    id: "session-algo",
    topic: "Dynamic programming drills",
    focus: "Exam prep",
    window: "Tomorrow",
    durationMinutes: 60,
    notes: "Solve 2 medium LeetCode problems without hints.",
    status: "planned",
  },
  {
    id: "session-team",
    topic: "Group project sync",
    focus: "Project build",
    window: "This week",
    durationMinutes: 30,
    notes: "Outline API contract before the Sunday handoff.",
    status: "completed",
  },
];

const minutesLabel = (minutes: number) => `${minutes} min`;

const generateSessionId = () =>
  `session-${Math.random().toString(36).slice(2, 8)}`;

export function StudyPlannerApplet() {
  const [sessions, setSessions] = useState<StudySession[]>(defaultSessions);
  const [activeWindow, setActiveWindow] = useState<TimeWindow | "All">("Today");
  const [formState, setFormState] = useState({
    topic: "",
    focus: FOCUS_TYPES[0] satisfies FocusType,
    window: "Today" as TimeWindow,
    notes: "",
    durationMinutes: 45,
  });

  const filteredSessions = sessions.filter((session) => {
    if (activeWindow === "All") return true;
    return session.window === activeWindow;
  });

  const total = sessions.length;
  const completed = sessions.filter(
    (session) => session.status === "completed",
  ).length;
  const upcomingToday = sessions.filter(
    (session) => session.window === "Today" && session.status === "planned",
  ).length;
  const focusBreakdown = FOCUS_TYPES.map((type) => ({
    type,
    planned: sessions.filter(
      (session) => session.focus === type && session.status === "planned",
    ).length,
  }));
  const completion = total === 0 ? 0 : Math.round((completed / total) * 100);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.topic.trim()) return;

    const session: StudySession = {
      id: generateSessionId(),
      topic: formState.topic.trim(),
      focus: formState.focus,
      window: formState.window,
      notes: formState.notes.trim(),
      durationMinutes: formState.durationMinutes,
      status: "planned",
    };

    setSessions((current) => [session, ...current]);
    setFormState({
      topic: "",
      focus: formState.focus,
      window: formState.window,
      notes: "",
      durationMinutes: formState.durationMinutes,
    });
  };

  const handleToggleStatus = (id: string) => {
    setSessions((current) =>
      current.map((session) =>
        session.id === id
          ? {
              ...session,
              status: session.status === "completed" ? "planned" : "completed",
            }
          : session,
      ),
    );
  };

  const handleChange = (
    field: keyof typeof formState,
    value: string | number,
  ) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle>Study Planner</CardTitle>
        <CardDescription>
          Shape a focused study block list that keeps classes, labs, and code
          review aligned.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2 text-xs">
          <Badge variant="outline">{total} sessions tracked</Badge>
          <Badge variant={upcomingToday > 0 ? "success" : "secondary"}>
            {upcomingToday} due today
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-6 overflow-auto">
        <section aria-labelledby="study-planner-progress">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p id="study-planner-progress" className="text-sm font-medium">
                Weekly completion
              </p>
              <p className="text-muted-foreground text-xs">
                Keep streaks strong before exams.
              </p>
            </div>
            <span className="font-semibold text-sm" aria-live="polite">
              {completion}%
            </span>
          </div>
          <Progress
            value={completion}
            aria-describedby="study-planner-progress"
          />
        </section>

        <form
          className="grid gap-4 rounded-lg border p-4"
          onSubmit={handleSubmit}
        >
          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">Add a study block</legend>
            <div className="grid gap-1">
              <Label htmlFor="study-topic">Topic</Label>
              <Input
                id="study-topic"
                value={formState.topic}
                onChange={(event) => handleChange("topic", event.target.value)}
                placeholder="Neuro lecture review"
                required
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="study-notes">Intent</Label>
              <Textarea
                id="study-notes"
                value={formState.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
                placeholder="Outline critical pathways, focus on practice questions."
                rows={3}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1">
                <Label htmlFor="study-focus">Focus</Label>
                <Button
                  id="study-focus"
                  type="button"
                  variant="outline"
                  className="justify-between"
                  onClick={() => {
                    const nextIndex =
                      (FOCUS_TYPES.indexOf(formState.focus) + 1) %
                      FOCUS_TYPES.length;
                    handleChange("focus", FOCUS_TYPES[nextIndex]);
                  }}
                >
                  {formState.focus}
                </Button>
                <p className="text-muted-foreground text-xs">
                  Tap to cycle through focus types.
                </p>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="study-window">When</Label>
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label="Select study window"
                >
                  {TIME_WINDOWS.map((window) => (
                    <Button
                      key={window}
                      type="button"
                      id={
                        window === formState.window ? "study-window" : undefined
                      }
                      variant={
                        formState.window === window ? "default" : "outline"
                      }
                      className="flex-1"
                      onClick={() => handleChange("window", window)}
                    >
                      {window}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="study-duration">Duration (minutes)</Label>
                <Input
                  id="study-duration"
                  type="number"
                  min={20}
                  max={180}
                  step={5}
                  inputMode="numeric"
                  value={formState.durationMinutes}
                  onChange={(event) =>
                    handleChange("durationMinutes", Number(event.target.value))
                  }
                />
              </div>
            </div>
          </fieldset>
          <div className="flex flex-wrap justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {focusBreakdown.map((entry) => (
                <Badge key={entry.type} variant="secondary">
                  {entry.type}: {entry.planned}
                </Badge>
              ))}
            </div>
            <Button type="submit">Add session</Button>
          </div>
        </form>

        <section className="space-y-3" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-sm">Active window</p>
            {["All", ...TIME_WINDOWS].map((window) => (
              <Button
                key={window}
                type="button"
                variant={activeWindow === window ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveWindow(window as typeof activeWindow)}
              >
                {window}
              </Button>
            ))}
          </div>

          {filteredSessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing scheduled here yet—add your next block to keep momentum
              going.
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredSessions.map((session) => (
                <li key={session.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{session.topic}</p>
                      <p className="text-muted-foreground text-xs">
                        {session.window} •{" "}
                        {minutesLabel(session.durationMinutes)} •{" "}
                        {session.focus}
                      </p>
                    </div>
                    <Badge
                      variant={
                        session.status === "completed" ? "success" : "outline"
                      }
                    >
                      {session.status === "completed" ? "Completed" : "Planned"}
                    </Badge>
                  </div>
                  {session.notes ? (
                    <p className="mt-2 text-sm leading-relaxed">
                      {session.notes}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(session.id)}
                    >
                      {session.status === "completed"
                        ? "Mark as planned"
                        : "Mark complete"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleChange("window", session.window)}
                    >
                      Match window
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Pro tip: bundle labs with code reviews to save switching cost—pair
          with your focus timer.
        </span>
        <span aria-live="polite">{completed} completed this week</span>
      </CardFooter>
    </Card>
  );
}

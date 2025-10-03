import { useId, useRef, useState } from "react";

type EnergyLevel = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  energy: EnergyLevel;
  done: boolean;
};

const ENERGY_DETAILS: Record<EnergyLevel, { label: string; blurb: string }> = {
  low: {
    label: "Light lift",
    blurb: "Great for when you have 10 spare minutes.",
  },
  medium: {
    label: "Medium focus",
    blurb: "Moves the needle without taking the whole day.",
  },
  high: {
    label: "Deep focus",
    blurb: "Save for when your calendar is clear.",
  },
};

const STARTER_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Outline the next workspace milestone",
    energy: "high",
    done: false,
  },
  {
    id: "task-2",
    title: "Review the latest Convex schema diff",
    energy: "medium",
    done: false,
  },
  {
    id: "task-3",
    title: "Send kudos to the last ship-it owner",
    energy: "low",
    done: true,
  },
];

export function TaskPlannerApplet() {
  const [tasks, setTasks] = useState<Task[]>(STARTER_TASKS);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftEnergy, setDraftEnergy] = useState<EnergyLevel>("medium");
  const idPrefix = useId();
  const counterRef = useRef(STARTER_TASKS.length + 1);

  const activeTasks = tasks.filter((task) => !task.done);
  const completedTasks = tasks.filter((task) => task.done);
  const completedCount = completedTasks.length;
  const totalCount = tasks.length;
  const completion = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  const addTask = () => {
    if (!draftTitle.trim()) {
      return;
    }

    setTasks((current) => [
      {
        id: `${idPrefix}-${counterRef.current++}`,
        title: draftTitle.trim(),
        energy: draftEnergy,
        done: false,
      },
      ...current,
    ]);
    setDraftTitle("");
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4 text-sm">
      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-slate-100/70 via-background to-background p-4 shadow-sm dark:from-slate-700/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Task Planner</h2>
            <p className="text-xs text-muted-foreground">
              Line up quick wins and deep focus blocks without leaving the
              canvas.
            </p>
          </div>
          <div className="flex flex-col items-end text-xs">
            <span className="font-semibold">{completedCount} completed</span>
            <span className="text-muted-foreground">{completion}% of plan</span>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <form
        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          addTask();
        }}
      >
        <label className="flex flex-col gap-2 text-xs font-medium">
          Add a task
          <input
            type="text"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Ship workspace sync preview"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>
        <fieldset
          className="flex flex-wrap gap-2"
          aria-label="Suggested effort levels"
        >
          {(Object.keys(ENERGY_DETAILS) as EnergyLevel[]).map((energy) => (
            <button
              key={energy}
              type="button"
              onClick={() => setDraftEnergy(energy)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                draftEnergy === energy
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {ENERGY_DETAILS[energy].label}
            </button>
          ))}
        </fieldset>
        <p className="text-xs text-muted-foreground">
          {ENERGY_DETAILS[draftEnergy].blurb}
        </p>
        <button
          type="submit"
          className="self-start rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Add to queue
        </button>
      </form>

      <div className="grid flex-1 grid-rows-2 gap-4 md:grid-cols-2 md:grid-rows-1">
        <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Today&apos;s focus</h3>
            <span className="text-xs text-muted-foreground">
              {activeTasks.length} open
            </span>
          </header>
          <ul className="flex flex-1 flex-col gap-3 overflow-auto pr-1">
            {activeTasks.length === 0 ? (
              <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                Nothing queued — add a quick win above.
              </li>
            ) : (
              activeTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border bg-background/60 px-3 py-2 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {ENERGY_DETAILS[task.energy].label}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => {
                      setTasks((current) =>
                        current.map((item) =>
                          item.id === task.id ? { ...item, done: true } : item,
                        ),
                      );
                    }}
                  >
                    Done
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Wins logged</h3>
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => {
                setTasks((current) => current.filter((task) => !task.done));
              }}
            >
              Clear
            </button>
          </header>
          <ul className="flex flex-1 flex-col gap-3 overflow-auto pr-1">
            {completedTasks.length === 0 ? (
              <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                Your next win will land here.
              </li>
            ) : (
              completedTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium line-through decoration-muted-foreground/50">
                      {task.title}
                    </p>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {ENERGY_DETAILS[task.energy].label}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => {
                      setTasks((current) =>
                        current.map((item) =>
                          item.id === task.id ? { ...item, done: false } : item,
                        ),
                      );
                    }}
                  >
                    Restore
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

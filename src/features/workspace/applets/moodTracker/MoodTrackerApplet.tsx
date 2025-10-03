import { useRef, useState } from "react";

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

type MoodOption = {
  value: number;
  label: string;
  helper: string;
  gradient: string;
};

const MOODS: MoodOption[] = [
  {
    value: 5,
    label: "Flowing",
    helper: "Energy is high and momentum is real.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    value: 4,
    label: "Upbeat",
    helper: "Engaged and optimistic about the work.",
    gradient: "from-sky-500 to-indigo-500",
  },
  {
    value: 3,
    label: "Steady",
    helper: "Present, productive, and holding the line.",
    gradient: "from-amber-400 to-amber-500",
  },
  {
    value: 2,
    label: "Drifting",
    helper: "Could use a break or a teammate check-in.",
    gradient: "from-orange-400 to-rose-500",
  },
  {
    value: 1,
    label: "Spent",
    helper: "Recharge before picking another deep-focus task.",
    gradient: "from-rose-500 to-pink-500",
  },
];

type MoodEntry = {
  id: string;
  value: number;
  note: string;
  timestamp: number;
};

export function MoodTrackerApplet() {
  const [selectedMood, setSelectedMood] = useState<number>(MOODS[1].value);
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const counterRef = useRef(0);

  const averageMood = entries.length
    ? entries.reduce((total, entry) => total + entry.value, 0) / entries.length
    : selectedMood;
  const averagePercent = Math.round(((averageMood - 1) / 4) * 100);

  const activeMood =
    MOODS.find((mood) => mood.value === selectedMood) ?? MOODS[1];

  return (
    <div className="flex h-full flex-col gap-4 p-4 text-sm">
      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-purple-100/70 via-background to-background p-4 shadow-sm dark:from-purple-600/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Mood Tracker</h2>
            <p className="text-xs text-muted-foreground">
              Capture how your session feels and spot trends across the week.
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="font-semibold">
              Avg · {averageMood.toFixed(1)}/5
            </span>
            <div className="mt-1 h-2 w-24 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${averagePercent}%` }}
              />
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {activeMood.helper}
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <h3 className="text-sm font-semibold">How are you feeling?</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              type="button"
              aria-pressed={selectedMood === mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={`group relative flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selectedMood === mood.value
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              <span
                className={`h-8 w-16 rounded-md bg-gradient-to-br ${mood.gradient} opacity-80 transition group-hover:opacity-100`}
                aria-hidden="true"
              />
              {mood.label}
            </button>
          ))}
        </div>
        <label className="mt-4 flex flex-col gap-2 text-xs font-medium">
          Context (optional)
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Pair programmed with Alex; shipped the dock pin fix."
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>
        <button
          type="button"
          className="mt-3 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => {
            setEntries((current) => [
              {
                id: `mood-${counterRef.current++}`,
                value: selectedMood,
                note: note.trim(),
                timestamp: Date.now(),
              },
              ...current.slice(0, 7),
            ]);
            setNote("");
          }}
        >
          Log mood snapshot
        </button>
      </div>

      <section className="flex flex-1 flex-col gap-3 rounded-xl border border-border/60 p-4">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent entries</h3>
          <span className="text-xs text-muted-foreground">
            {entries.length || 0} saved
          </span>
        </header>
        <ul className="flex flex-1 flex-col gap-3 overflow-auto pr-1">
          {entries.length === 0 ? (
            <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              Log the first snapshot to start your streak.
            </li>
          ) : (
            entries.map((entry) => {
              const matchingMood = MOODS.find(
                (mood) => mood.value === entry.value,
              );

              return (
                <li
                  key={entry.id}
                  className="flex flex-col gap-2 rounded-md border border-border bg-background/60 px-3 py-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {matchingMood?.label ?? "Mood"} · {entry.value}/5
                    </span>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={new Date(entry.timestamp).toISOString()}
                    >
                      {DATE_FORMATTER.format(new Date(entry.timestamp))}
                    </time>
                  </div>
                  {entry.note ? (
                    <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
                      {entry.note}
                    </p>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}

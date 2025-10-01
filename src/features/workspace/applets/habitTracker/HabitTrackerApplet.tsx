import { FormEvent, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `habit-${Math.random().toString(16).slice(2)}`;

type Habit = {
  id: string;
  name: string;
  checks: boolean[];
};

const createHabit = (name: string): Habit => ({
  id: generateId(),
  name,
  checks: Array<boolean>(WEEK_DAYS.length).fill(false),
});

const DEFAULT_HABITS: Habit[] = [
  {
    id: "hydrate",
    name: "Hydrate 8 glasses",
    checks: [true, true, true, false, false, false, false],
  },
  {
    id: "movement",
    name: "Move for 20 minutes",
    checks: [true, false, true, false, false, false, false],
  },
];

const countActiveStreak = (checks: boolean[]) => {
  let streak = 0;
  for (let index = checks.length - 1; index >= 0; index -= 1) {
    if (!checks[index]) break;
    streak += 1;
  }
  return streak;
};

const countCompleted = (checks: boolean[]) => checks.filter(Boolean).length;

export function HabitTrackerApplet() {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [pendingName, setPendingName] = useState("");

  const totalCompleted = habits.reduce(
    (count, habit) => count + countCompleted(habit.checks),
    0,
  );
  const totalPossible = habits.length * WEEK_DAYS.length;
  const overallCompletion =
    totalPossible === 0
      ? 0
      : Math.round((totalCompleted / totalPossible) * 100);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = pendingName.trim();
    if (!normalized) return;
    setHabits((previous) => [createHabit(normalized), ...previous]);
    setPendingName("");
  };

  const toggleDay = (habitId: string, dayIndex: number) => {
    setHabits((previous) =>
      previous.map((habit) => {
        if (habit.id !== habitId) return habit;
        const checks = habit.checks.slice();
        checks[dayIndex] = !checks[dayIndex];
        return { ...habit, checks };
      }),
    );
  };

  const handleResetWeek = () => {
    setHabits((previous) =>
      previous.map((habit) => ({
        ...habit,
        checks: habit.checks.map(() => false),
      })),
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle>Habit Tracker</CardTitle>
        <CardDescription>
          Build consistency with a seven-day snapshot and streak-aware tracking.
        </CardDescription>
        <Badge variant="secondary">
          {overallCompletion}% weekly completion
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <Input
            value={pendingName}
            onChange={(event) => setPendingName(event.target.value)}
            placeholder="Add a habit (e.g. Journal for 5 min)"
            aria-label="Add a new habit"
          />
          <Button type="submit" disabled={!pendingName.trim()}>
            Add
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className="pl-2">Habit</span>
          <div className="grid grid-cols-7 gap-1 text-right">
            {WEEK_DAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>

        <Separator />

        {habits.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No habits yet—add something you want to celebrate daily.
          </p>
        ) : (
          <ul
            className="list-none space-y-3 overflow-y-auto pr-1"
            aria-label="Habit list"
          >
            {habits.map((habit) => {
              const completedCount = countCompleted(habit.checks);
              const activeStreak = countActiveStreak(habit.checks);
              return (
                <li
                  key={habit.id}
                  className="border-border/60 bg-muted/40 hover:border-border/80 flex flex-col gap-3 rounded-lg border p-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{habit.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {completedCount} / {WEEK_DAYS.length} this week
                      </p>
                    </div>
                    {activeStreak > 0 && (
                      <Badge variant="info">Streak: {activeStreak}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEK_DAYS.map((day, index) => {
                      const checked = habit.checks[index];
                      return (
                        <Button
                          key={day}
                          type="button"
                          variant={checked ? "default" : "ghost"}
                          size="sm"
                          className="h-8 px-0 text-[0.7rem]"
                          onClick={() => toggleDay(habit.id, index)}
                          aria-pressed={checked}
                        >
                          {day}
                        </Button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex items-center justify-between gap-2 pt-4">
        <p className="text-muted-foreground text-xs">
          {habits.length === 0
            ? "Start with one small habit to build momentum."
            : `${totalCompleted} check-ins logged this week.`}
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={handleResetWeek}
          disabled={habits.length === 0}
        >
          Reset week
        </Button>
      </CardFooter>
    </Card>
  );
}

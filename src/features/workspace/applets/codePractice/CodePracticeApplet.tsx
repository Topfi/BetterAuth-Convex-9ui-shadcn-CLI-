import { useState } from "react";

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
import { Separator } from "@/components/ui/separator";

const PROBLEMS = [
  {
    id: "trace-linked-lists",
    title: "Trace Linked Lists",
    summary: "Debug pointer swaps in a student-built list utility.",
    detail:
      "You are handed a singly linked list helper that swaps nodes in pairs. Walk the code, fix the bug that drops the tail when the list is odd length, and explain the invariant you kept.",
    tags: ["Data Structures", "Debugging"],
    difficulty: "Starter",
    estimateMinutes: 20,
    resource: "https://visualgo.net/en/list",
  },
  {
    id: "study-group-scheduler",
    title: "Study Group Scheduler",
    summary:
      "Design a small endpoint for pairing classmates across time zones.",
    detail:
      "Given a list of availability windows (start, end, timezone) for med + CS teammates, group them into overlapping 60-minute blocks. Focus on creating a clear data shape you can hand to a Convex mutation.",
    tags: ["Systems", "Design"],
    difficulty: "Core",
    estimateMinutes: 35,
    resource: "https://convex.dev/guide/data-model",
  },
  {
    id: "triage-simulator",
    title: "Triage Simulator API",
    summary: "Balance event-driven vitals streaming with local triage UI.",
    detail:
      "Sketch a Convex action that ingests streaming vitals and emits prioritized triage updates for an emergency medicine drill. Explain how you keep the local React compiler happy while syncing remote state.",
    tags: ["Realtime", "Architecture"],
    difficulty: "Advanced",
    estimateMinutes: 40,
    resource: "https://react.dev/learn/start-a-new-react-project",
  },
] as const;

type ProblemStatus = "unstarted" | "solving" | "solved" | "review";

type PracticeProblem = (typeof PROBLEMS)[number] & {
  status: ProblemStatus;
  reflections: string[];
};

const createInitialProblems = (): PracticeProblem[] =>
  PROBLEMS.map((problem) => ({
    ...problem,
    status: "unstarted",
    reflections: [],
  }));

const STATUS_LABEL: Record<ProblemStatus, string> = {
  unstarted: "Queued",
  solving: "In progress",
  solved: "Solved",
  review: "Review queued",
};

export function CodePracticeApplet() {
  const [problems, setProblems] = useState<PracticeProblem[]>(
    createInitialProblems,
  );
  const [activeTag, setActiveTag] = useState<string>("All");
  const [activeDifficulty, setActiveDifficulty] = useState<string>("All");
  const [selectedProblemId, setSelectedProblemId] = useState<string>(
    PROBLEMS[0]?.id ?? "",
  );

  const uniqueTags = [
    "All",
    ...new Set(PROBLEMS.flatMap((problem) => problem.tags)),
  ];
  const difficulties = [
    "All",
    ...new Set(PROBLEMS.map((problem) => problem.difficulty)),
  ];

  const filteredProblems = problems.filter((problem) => {
    const matchesTag = activeTag === "All" || problem.tags.includes(activeTag);
    const matchesDifficulty =
      activeDifficulty === "All" || problem.difficulty === activeDifficulty;
    return matchesTag && matchesDifficulty;
  });

  const selectedProblem =
    problems.find((problem) => problem.id === selectedProblemId) ??
    filteredProblems[0];

  const progress = {
    solved: problems.filter((problem) => problem.status === "solved").length,
    solving: problems.filter((problem) => problem.status === "solving").length,
    review: problems.filter((problem) => problem.status === "review").length,
  };

  const handleStatusChange = (id: string, status: ProblemStatus) => {
    setProblems((current) =>
      current.map((problem) =>
        problem.id === id
          ? {
              ...problem,
              status,
            }
          : problem,
      ),
    );
  };

  const handleReflection = (id: string, note: string) => {
    if (!note.trim()) return;
    setProblems((current) =>
      current.map((problem) =>
        problem.id === id
          ? {
              ...problem,
              reflections: [note.trim(), ...problem.reflections].slice(0, 3),
            }
          : problem,
      ),
    );
  };

  const handlePlanReview = (id: string) => {
    handleStatusChange(id, "review");
    handleReflection(id, "Plan a spaced repetition pass in 48 hours.");
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle>Code Practice Lab</CardTitle>
        <CardDescription>
          Mix med-sim systems with CS drills—log progress and prep for the next
          stand-up.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2 text-xs">
          <Badge variant={progress.solved > 0 ? "success" : "outline"}>
            {progress.solved} solved
          </Badge>
          <Badge variant={progress.solving > 0 ? "info" : "secondary"}>
            {progress.solving} in flight
          </Badge>
          <Badge variant="outline">{progress.review} scheduled reviews</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
        <section className="space-y-3">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by tag"
          >
            {uniqueTags.map((tag) => (
              <Button
                key={tag}
                type="button"
                variant={activeTag === tag ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by difficulty"
          >
            {difficulties.map((difficulty) => (
              <Button
                key={difficulty}
                type="button"
                variant={activeDifficulty === difficulty ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveDifficulty(difficulty)}
              >
                {difficulty}
              </Button>
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6">
          <aside
            className="space-y-2 overflow-auto pr-1"
            aria-label="Problem list"
          >
            {filteredProblems.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No matches—toggle filters to bring problems back into view.
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredProblems.map((problem) => (
                  <li key={problem.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedProblemId(problem.id)}
                      className="focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-2 w-full rounded-md border p-3 text-left transition hover:border-ring"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <Badge variant="outline">{problem.difficulty}</Badge>
                        <span className="text-muted-foreground">
                          {STATUS_LABEL[problem.status]}
                        </span>
                      </div>
                      <p className="mt-2 font-medium leading-snug">
                        {problem.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {problem.summary}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {selectedProblem ? (
            <article
              className="flex h-full flex-col rounded-lg border"
              aria-live="polite"
            >
              <header className="border-b p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {selectedProblem.tags.join(" • ")}
                </p>
                <h3 className="mt-1 text-lg font-semibold leading-tight">
                  {selectedProblem.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {selectedProblem.detail}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">{selectedProblem.difficulty}</Badge>
                  <Badge variant="secondary">
                    {selectedProblem.estimateMinutes} min target
                  </Badge>
                </div>
              </header>
              <div className="flex flex-1 flex-col justify-between gap-4 p-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedProblem.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {selectedProblem.reflections.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium">Recent reflections</p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {selectedProblem.reflections.map(
                          (reflection, index) => (
                            <li
                              key={`${selectedProblem.id}-reflection-${index}`}
                            >
                              {reflection}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Log a quick takeaway after you wrap—keep the feedback loop
                      tight.
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() =>
                        handleStatusChange(selectedProblem.id, "solving")
                      }
                    >
                      Start solving
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        handleStatusChange(selectedProblem.id, "solved")
                      }
                    >
                      Mark solved
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handlePlanReview(selectedProblem.id)}
                    >
                      Queue review
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        handleStatusChange(selectedProblem.id, "unstarted")
                      }
                    >
                      Reset
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Resource</span>
                    <a
                      href={selectedProblem.resource}
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground underline"
                    >
                      Reference link
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <article className="grid h-full place-items-center rounded-lg border text-sm text-muted-foreground">
              Select a problem to dive in.
            </article>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Pair this with the study planner applet to line up code reps before
          anatomy lab.
        </span>
        <span aria-live="polite">
          {progress.solved} / {problems.length} complete
        </span>
      </CardFooter>
    </Card>
  );
}

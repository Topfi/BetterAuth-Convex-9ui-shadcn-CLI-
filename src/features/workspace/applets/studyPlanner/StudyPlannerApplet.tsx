import { FormEvent, useState } from "react";

type Priority = "low" | "medium" | "high";

type StudyTask = {
  id: string;
  title: string;
  course: string;
  due: string;
  priority: Priority;
  completed: boolean;
};

const INITIAL_TASKS: StudyTask[] = [
  {
    id: "1",
    title: "Review pharmacokinetics lecture",
    course: "Biochem 312",
    due: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    priority: "high",
    completed: false,
  },
  {
    id: "2",
    title: "Finish linked list assignment",
    course: "CS 201",
    due: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    priority: "medium",
    completed: false,
  },
];

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium:
    "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  high: "bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-200",
};

const relativeDueDate = (iso: string) => {
  const dueDate = new Date(iso);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours <= 0) {
    return "Due now";
  }
  if (diffHours < 24) {
    return `Due in ${diffHours}h`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `Due in ${diffDays}d`;
};

export function StudyPlannerApplet() {
  const [tasks, setTasks] = useState<StudyTask[]>(INITIAL_TASKS);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !due) {
      return;
    }

    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        course: course.trim(),
        due: new Date(due).toISOString(),
        priority,
        completed: false,
      },
    ]);

    setTitle("");
    setCourse("");
    setDue("");
    setPriority("medium");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime(),
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 text-sm">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Study Planner</h2>
        <p className="text-muted-foreground">
          Map out upcoming work across courses at a glance.
        </p>
      </header>

      <form
        onSubmit={addTask}
        className="grid gap-2 rounded-md border p-3 text-xs md:grid-cols-4 md:items-end"
      >
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="font-medium">Task</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-md border px-2 py-1"
            placeholder="Write lab report"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Course</span>
          <input
            value={course}
            onChange={(event) => setCourse(event.target.value)}
            className="rounded-md border px-2 py-1"
            placeholder="Anatomy 204"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Due</span>
          <input
            type="datetime-local"
            value={due}
            onChange={(event) => setDue(event.target.value)}
            className="rounded-md border px-2 py-1"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Priority</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            className="rounded-md border px-2 py-1"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <button
          type="submit"
          className="mt-1 rounded-md border px-3 py-2 text-xs font-medium transition hover:bg-muted md:col-span-4"
        >
          Add task
        </button>
      </form>

      <ul className="flex flex-1 flex-col gap-2 overflow-auto">
        {sortedTasks.map((task) => {
          const priorityLabel = PRIORITY_LABELS[task.priority];
          const priorityBadge = PRIORITY_STYLES[task.priority];
          return (
            <li
              key={task.id}
              className="flex items-start justify-between gap-3 rounded-md border p-3"
            >
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <input
                    id={`task-${task.id}`}
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.title}
                  </label>
                </div>
                {task.course ? (
                  <span className="text-xs text-muted-foreground">
                    {task.course}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-1 font-medium ${priorityBadge}`}
                >
                  {priorityLabel}
                </span>
                <span className="text-muted-foreground">
                  {relativeDueDate(task.due)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

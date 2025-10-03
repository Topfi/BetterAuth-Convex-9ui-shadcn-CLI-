import { useState } from "react";

type CodingConcept = {
  id: string;
  title: string;
  summary: string;
  keyIdeas: string[];
  practicePrompt: string;
  goDeeper: string;
};

const CONCEPTS: CodingConcept[] = [
  {
    id: "binary_search",
    title: "Binary Search Patterns",
    summary:
      "Use two pointers and invariants to search sorted data or answer monotonic questions.",
    keyIdeas: [
      "Define what makes the answer space monotonic (true/false boundary).",
      "Decide between inclusive/exclusive mid updates to avoid infinite loops.",
      "Check edge cases: empty arrays, single element, even/odd lengths.",
    ],
    practicePrompt:
      "LeetCode 875: Koko Eating Bananas — determine minimum speed via binary search over the answer.",
    goDeeper:
      "Re-implement lower_bound/upper_bound and practice binary searching over time or capacity.",
  },
  {
    id: "dynamic_programming",
    title: "Dynamic Programming",
    summary:
      "Break a problem into overlapping subproblems, store results, and compose the global solution.",
    keyIdeas: [
      "State definition: what indexes/choices uniquely describe progress?",
      "Transition: derive recurrence using previous states; memoize or tabulate.",
      "Order: tabulate bottom-up by increasing dependency or leverage recursion with memoization.",
    ],
    practicePrompt:
      "AtCoder Educational DP Contest: solve A-F to master one- and two-dimensional DP states.",
    goDeeper:
      "Translate recurrences between top-down and bottom-up forms to verify correctness.",
  },
  {
    id: "graph_traversal",
    title: "Graph Traversal",
    summary:
      "Traverse graphs with BFS/DFS to explore components, detect cycles, or compute ordering.",
    keyIdeas: [
      "Model the graph explicitly: adjacency list, matrix, or implicit neighbors.",
      "Track visited nodes to avoid infinite loops and to measure discovery order.",
      "Use BFS for shortest paths on unweighted graphs, DFS for cycle detection and topological sort.",
    ],
    practicePrompt:
      "Implement topological sort for course scheduling with both DFS and Kahn's algorithm.",
    goDeeper:
      "Extend traversals with weights using Dijkstra or 0-1 BFS when edges vary.",
  },
];

export function CodingConceptsApplet() {
  const [selectedConceptId, setSelectedConceptId] = useState(CONCEPTS[0].id);
  const selectedConcept = CONCEPTS.find(
    (concept) => concept.id === selectedConceptId,
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 text-sm">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Coding Concepts</h2>
        <p className="text-muted-foreground">
          Quick refreshers on patterns that show up in interviews and exams.
        </p>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        <div className="flex shrink-0 flex-row gap-2 overflow-auto md:flex-col">
          {CONCEPTS.map((concept) => {
            const isActive = concept.id === selectedConceptId;
            return (
              <button
                key={concept.id}
                type="button"
                className={`rounded-md border px-3 py-2 text-xs font-medium transition hover:bg-muted ${isActive ? "bg-muted" : ""}`}
                onClick={() => setSelectedConceptId(concept.id)}
                aria-pressed={isActive}
              >
                {concept.title}
              </button>
            );
          })}
        </div>
        {selectedConcept ? (
          <section
            className="flex min-h-[200px] flex-1 flex-col gap-3 rounded-md border p-4"
            aria-live="polite"
          >
            <div>
              <h3 className="text-sm font-semibold">Why it matters</h3>
              <p className="text-sm text-muted-foreground">
                {selectedConcept.summary}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Key ideas</h3>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {selectedConcept.keyIdeas.map((idea) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            </div>
            <div className="grid gap-1 text-xs">
              <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                Practice prompt
              </span>
              <p>{selectedConcept.practicePrompt}</p>
            </div>
            <div className="grid gap-1 text-xs">
              <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                Go deeper
              </span>
              <p>{selectedConcept.goDeeper}</p>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

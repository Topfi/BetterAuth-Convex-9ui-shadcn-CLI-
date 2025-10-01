import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CodePracticeApplet } from "./CodePracticeApplet";

describe("CodePracticeApplet", () => {
  it("updates status and filters problems", () => {
    render(<CodePracticeApplet />);

    const startButton = screen.getByRole("button", { name: /Start solving/i });
    fireEvent.click(startButton);

    expect(screen.getByText(/1 in flight/i)).toBeInTheDocument();

    const designFilter = screen.getByRole("button", { name: "Design" });
    fireEvent.click(designFilter);

    const problemList = screen.getByLabelText(/Problem list/i);
    expect(
      within(problemList).getByText(/Study Group Scheduler/i),
    ).toBeInTheDocument();
    expect(
      within(problemList).queryByText(/Trace Linked Lists/i),
    ).not.toBeInTheDocument();
  });
});

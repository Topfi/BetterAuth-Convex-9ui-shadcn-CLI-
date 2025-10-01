import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudyPlannerApplet } from "./StudyPlannerApplet";

describe("StudyPlannerApplet", () => {
  it("adds a study session and marks it complete", () => {
    render(<StudyPlannerApplet />);

    const topicInput = screen.getByLabelText(/Topic/i);
    fireEvent.change(topicInput, { target: { value: "Cardio case review" } });

    const intentField = screen.getByLabelText(/Intent/i);
    fireEvent.change(intentField, {
      target: { value: "Triage murmurs before tomorrow's lab." },
    });

    const addButton = screen.getByRole("button", { name: "Add session" });
    fireEvent.click(addButton);

    const newSession = screen.getByText("Cardio case review").closest("li");
    expect(newSession).not.toBeNull();
    if (!newSession) return;

    const markCompleteButton = within(newSession).getByRole("button", {
      name: "Mark complete",
    });
    fireEvent.click(markCompleteButton);

    expect(within(newSession).getByText("Completed")).toBeInTheDocument();
  });
});

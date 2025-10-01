import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HabitTrackerApplet } from "./HabitTrackerApplet";

describe("HabitTrackerApplet", () => {
  it("shows default habits and allows toggling", () => {
    render(<HabitTrackerApplet />);

    const mondayButtons = screen.getAllByRole("button", { name: "Mon" });
    expect(mondayButtons[0]).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(mondayButtons[0]);
    expect(mondayButtons[0]).toHaveAttribute("aria-pressed", "false");
  });

  it("adds a new habit at the top", () => {
    render(<HabitTrackerApplet />);

    const [input] = screen.getAllByLabelText("Add a new habit");
    fireEvent.change(input, { target: { value: "Read 10 pages" } });
    const [addButton] = screen.getAllByRole("button", { name: "Add" });
    fireEvent.click(addButton);

    const habitItems = screen.getAllByRole("listitem");
    expect(habitItems[0]).toHaveTextContent("Read 10 pages");
  });
});

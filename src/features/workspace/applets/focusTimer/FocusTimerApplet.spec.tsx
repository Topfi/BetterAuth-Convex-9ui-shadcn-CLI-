import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FocusTimerApplet } from "./FocusTimerApplet";

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("FocusTimerApplet", () => {
  it("renders default session controls", () => {
    render(<FocusTimerApplet />);

    expect(screen.getByText("Focus Timer")).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });

  it("counts down while running", () => {
    vi.useFakeTimers();

    render(<FocusTimerApplet />);

    const [startButton] = screen.getAllByRole("button", { name: "Start" });
    fireEvent.click(startButton);
    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(screen.getByText("24:59")).toBeInTheDocument();
  });
});

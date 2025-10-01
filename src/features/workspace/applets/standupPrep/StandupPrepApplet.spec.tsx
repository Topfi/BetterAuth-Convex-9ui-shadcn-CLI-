import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StandupPrepApplet } from "./StandupPrepApplet";

describe("StandupPrepApplet", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });
  });

  it("renders standup sections", () => {
    render(<StandupPrepApplet />);

    expect(
      screen.getByRole("textbox", { name: /Since yesterday/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Today/i })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Blockers/i }),
    ).toBeInTheDocument();
  });

  it("copies structured output to the clipboard", async () => {
    render(<StandupPrepApplet />);

    const [yesterdayField] = screen.getAllByLabelText(/Since yesterday/i);
    fireEvent.change(yesterdayField, {
      target: { value: "Shipped the team sync view" },
    });
    const [todayField] = screen.getAllByLabelText(/Today/i);
    fireEvent.change(todayField, {
      target: { value: "Pair on auth handoff" },
    });

    const [copyButton] = screen.getAllByRole("button", {
      name: "Copy to clipboard",
    });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("Since yesterday:\nShipped the team sync view"),
    );
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      expect.stringContaining("Today:\nPair on auth handoff"),
    );
    await screen.findByText("Copied");
  });
});

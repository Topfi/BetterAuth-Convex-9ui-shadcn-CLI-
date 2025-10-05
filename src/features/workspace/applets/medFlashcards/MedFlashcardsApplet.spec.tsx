import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MedFlashcardsApplet } from "./MedFlashcardsApplet";

describe("MedFlashcardsApplet", () => {
  it("reveals answers and records confidence", () => {
    render(<MedFlashcardsApplet />);

    expect(screen.getByText(/Peek when you are ready/i)).toBeInTheDocument();

    const revealButton = screen.getByRole("button", { name: /Reveal answer/i });
    fireEvent.click(revealButton);

    expect(
      screen.getByText(
        /Stroke volume rises because of the Frank-Starling mechanism/i,
      ),
    ).toBeInTheDocument();

    const nailedItButton = screen.getByRole("button", { name: /Nailed it/i });
    fireEvent.click(nailedItButton);

    expect(screen.getByText(/1 confident/i)).toBeInTheDocument();
  });
});

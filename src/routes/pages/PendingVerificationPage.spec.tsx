import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PendingVerificationPage from "./PendingVerificationPage";
import { ThemeProvider } from "@/providers/theme-provider";

describe("PendingVerificationPage", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  it("informs users that their verification is pending for 24 hours", () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <PendingVerificationPage />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", {
        name: /confirm your email/i,
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We saved your details for 24 hours/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to sign in" }),
    ).toHaveAttribute("href", "/sign-in");
    expect(
      screen.getByRole("status", { name: /verification pending/i }),
    ).toBeInTheDocument();
  });
});

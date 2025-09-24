import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@/providers/theme-provider";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrivacyPage from "@/routes/pages/PrivacyPage";

describe("PrivacyPage", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? false : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  it("renders a privacy policy heading and placeholder copy", () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <PrivacyPage />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("region", { name: /privacy policy/i }),
    ).toBeInTheDocument();

    expect(
      screen.getAllByText(/replace this section with your team/i)[0],
    ).toBeInTheDocument();
  });
});

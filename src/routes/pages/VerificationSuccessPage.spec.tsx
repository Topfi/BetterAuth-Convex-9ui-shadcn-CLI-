import "@testing-library/jest-dom/vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import VerificationSuccessPage from "./VerificationSuccessPage";
import { ThemeProvider } from "@/providers/theme-provider";

function LocationObserver({
  onChange,
}: {
  onChange: (pathname: string) => void;
}) {
  const location = useLocation();

  useEffect(() => {
    onChange(location.pathname);
  }, [location, onChange]);

  return null;
}

describe("VerificationSuccessPage", () => {
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

  it("announces success and redirects to the workspace after five seconds", async () => {
    vi.useFakeTimers();
    try {
      let currentPath = "/auth/verification-success";

      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={["/auth/verification-success"]}>
            <LocationObserver onChange={(path) => (currentPath = path)} />
            <Routes>
              <Route
                path="/auth/verification-success"
                element={<VerificationSuccessPage />}
              />
              <Route path="/workspace" element={<div>workspace</div>} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>,
      );

      expect(
        screen.getByRole("heading", { name: /You're all set/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("status", { name: /redirecting to your workspace/i }),
      ).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(currentPath).toBe("/workspace");
    } finally {
      vi.useRealTimers();
    }
  });
});

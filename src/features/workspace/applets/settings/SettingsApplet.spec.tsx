import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/providers/theme-provider";
import { SettingsApplet } from "./SettingsApplet";
import { api } from "@/convex/api";

const useQueryMock = vi.fn();
const useMutationMock = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (query: unknown) => useQueryMock(query),
  useMutation: (mutation: unknown) => useMutationMock(mutation),
}));

describe("SettingsApplet", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useMutationMock.mockReset();
    useMutationMock.mockImplementation(() => {
      const mutate = vi.fn();
      (
        mutate as typeof mutate & {
          withOptimisticUpdate: typeof mutate;
        }
      ).withOptimisticUpdate = vi.fn(() => mutate);
      return mutate;
    });
    useQueryMock.mockImplementation((query) => {
      if (query === api.auth.getCurrentUser) {
        return {
          email: "person@example.com",
          image: null,
        };
      }
      if (query === api.identity.getMe) {
        return {
          usernameDisplay: "Person",
          usernameLower: "person",
        };
      }
      if (query === api.settings_theme.getPreferences) {
        return {
          mode: "light",
          backgroundPattern: "dots",
          accent: "blue",
        };
      }
      if (query === api.settings_localization.getPreferences) {
        return {
          timeZone: "system",
          dateFormat: "system",
          timeFormat: "system",
          showSeconds: true,
          language: "en",
        };
      }
      return undefined;
    });
    window.matchMedia = vi.fn(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(() => false),
    })) as unknown as typeof window.matchMedia;
    document.documentElement.classList.remove("light", "dark");
  });

  it("renders the settings tabs", () => {
    render(
      <ThemeProvider>
        <SettingsApplet />
      </ThemeProvider>,
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "General" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Theme" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Localization" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Privacy" })).toBeInTheDocument();
  });
});

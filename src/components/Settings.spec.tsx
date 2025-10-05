import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/providers/theme-provider";
import Settings from "./Settings";
import { api } from "@/convex/api";

const useQueryMock = vi.fn();
const useMutationMock = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (query: unknown) => useQueryMock(query),
  useMutation: (mutation: unknown) => useMutationMock(mutation),
}));

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("Settings", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useQueryMock.mockReset();
    useMutationMock.mockReset();
    useMutationMock.mockReturnValue(vi.fn());
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
      if (query === api.settings_security.getOverview) {
        return {
          hasPassphrase: true,
          twoFactorEnabled: false,
          risks: [],
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

  it("renders tabs and navigates back to the workspace", () => {
    render(
      <ThemeProvider>
        <Settings />
      </ThemeProvider>,
    );

    const backButton = screen.getByRole("button", {
      name: /back to workspace/i,
    });

    expect(backButton).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Security" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Privacy" })).toBeInTheDocument();

    fireEvent.click(backButton);

    expect(navigateMock).toHaveBeenCalledWith("/workspace");
  });
});

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/providers/theme-provider";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Workspace from "./Workspace";
import { useQuery } from "convex/react";

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

vi.mock("./Counter", () => ({
  default: () => <div data-testid="counter" />,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn(),
  },
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

type MockUser = {
  email: string;
  image: string | null;
  name: string | null;
};

describe("Workspace", () => {
  const mockUseQuery = vi.mocked(useQuery);

  beforeEach(() => {
    mockUseQuery.mockReset();
    navigateMock.mockReset();
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

  it("renders a fallback initial and heading when the user is missing a name", () => {
    mockUseQuery.mockReturnValue({
      email: "person@example.com",
      image: null,
      name: null,
    } satisfies MockUser);

    render(
      <ThemeProvider>
        <Workspace />
      </ThemeProvider>,
    );

    expect(screen.getByText("P")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Workspace" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "person@example.com" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "person@example.com" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Delete account")).not.toBeInTheDocument();
  });
});

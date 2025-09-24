import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthGate, Protected } from "@/routes/guards";
import { routes } from "@/routes/router";

type UseConvexAuth = (typeof import("convex/react"))["useConvexAuth"];
type UseQuery = (typeof import("convex/react"))["useQuery"];

const useConvexAuthMock = vi.fn<
  ReturnType<UseConvexAuth>,
  Parameters<UseConvexAuth>
>();
const useQueryMock = vi.fn<ReturnType<UseQuery>, Parameters<UseQuery>>();

vi.mock("convex/react", async () => {
  const actual =
    await vi.importActual<typeof import("convex/react")>("convex/react");
  return {
    ...actual,
    useConvexAuth: (...args: Parameters<UseConvexAuth>) =>
      useConvexAuthMock(...args),
    useQuery: (...args: Parameters<UseQuery>) => useQueryMock(...args),
  };
});

const authenticatedState = { isAuthenticated: true, isLoading: false };
const unauthenticatedState = { isAuthenticated: false, isLoading: false };

beforeEach(() => {
  useConvexAuthMock.mockReset();
  useQueryMock.mockReset();
});

afterEach(() => {
  cleanup();
});

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

describe("router", () => {
  it("defines core routes in the central configuration", () => {
    const definedPaths = routes.map((route) => route.path);

    expect(definedPaths).toEqual(
      expect.arrayContaining([
        "/",
        "/sign-in",
        "/sign-up",
        "/workspace",
        "/onboarding/username",
        "/terms",
        "/privacy",
        "*",
      ]),
    );
  });

  it("redirects root to workspace when authenticated", async () => {
    useConvexAuthMock.mockReturnValue(authenticatedState);
    useQueryMock.mockImplementation(() => ({
      usernameDisplay: "Ada",
      usernameLower: "ada",
    }));
    let currentPathname = "/";

    render(
      <MemoryRouter initialEntries={["/"]}>
        <LocationObserver
          onChange={(pathname) => (currentPathname = pathname)}
        />
        <Routes>
          <Route path="/" element={<AuthGate />} />
          <Route path="/workspace" element={<div>workspace</div>} />
          <Route path="/sign-in" element={<div>sign-in</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(currentPathname).toBe("/workspace");
    });
  });

  it("redirects root to sign-in when unauthenticated", async () => {
    useConvexAuthMock.mockReturnValue(unauthenticatedState);
    useQueryMock.mockImplementation(() => null);
    let currentPathname = "/";

    render(
      <MemoryRouter initialEntries={["/"]}>
        <LocationObserver
          onChange={(pathname) => (currentPathname = pathname)}
        />
        <Routes>
          <Route path="/" element={<AuthGate />} />
          <Route path="/workspace" element={<div>workspace</div>} />
          <Route path="/sign-in" element={<div>sign-in</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(currentPathname).toBe("/sign-in");
    });
  });

  it("redirects unauthenticated users away from protected routes", async () => {
    useConvexAuthMock.mockReturnValue(unauthenticatedState);
    useQueryMock.mockImplementation(() => null);
    let currentPathname = "/workspace";

    render(
      <MemoryRouter initialEntries={["/workspace"]}>
        <LocationObserver
          onChange={(pathname) => (currentPathname = pathname)}
        />
        <Routes>
          <Route path="/sign-in" element={<div>sign-in</div>} />
          <Route path="/workspace" element={<Protected />}>
            <Route index element={<div>workspace</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(currentPathname).toBe("/sign-in");
    });
  });
});

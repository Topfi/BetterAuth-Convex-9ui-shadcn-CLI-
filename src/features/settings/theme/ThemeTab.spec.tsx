import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ThemeTab from "./ThemeTab";
import type { ThemeSettings } from "@/shared/settings/theme";

const {
  useQueryMock,
  useMutationMock,
  setThemeMock,
  setBackgroundPatternMock,
  toastErrorMock,
  mutationCalls,
} = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  useMutationMock: vi.fn(),
  setThemeMock: vi.fn(),
  setBackgroundPatternMock: vi.fn(),
  toastErrorMock: vi.fn(),
  mutationCalls: [] as ThemeSettings[],
}));

vi.mock("convex/react", () => ({
  useQuery: (query: unknown, args: unknown) => useQueryMock(query, args),
  useMutation: (mutation: unknown) => useMutationMock(mutation),
}));

vi.mock("@/providers/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: setThemeMock,
    backgroundPattern: "cross",
    setBackgroundPattern: setBackgroundPatternMock,
  }),
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    error: toastErrorMock,
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    close: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
  },
}));

describe("ThemeTab", () => {
  const defaultSettings: ThemeSettings = {
    mode: "light",
    backgroundPattern: "cross",
  };

  beforeEach(() => {
    useQueryMock.mockReset();
    useMutationMock.mockReset();
    setThemeMock.mockReset();
    setBackgroundPatternMock.mockReset();
    toastErrorMock.mockReset();
    mutationCalls.length = 0;

    useQueryMock.mockReturnValue(defaultSettings);

    useMutationMock.mockImplementation(() => {
      let cached = defaultSettings;
      const mutate = vi.fn(async (args: ThemeSettings) => {
        mutationCalls.push(args);
        return args;
      });

      const localStore = {
        getQuery: vi.fn(() => cached),
        setQuery: vi.fn(
          (ref: unknown, params: unknown, value: ThemeSettings) => {
            cached = value;
          },
        ),
      };

      (
        mutate as typeof mutate & {
          withOptimisticUpdate: (
            updater: (store: typeof localStore, args: ThemeSettings) => void,
          ) => (args: ThemeSettings) => Promise<ThemeSettings>;
        }
      ).withOptimisticUpdate = (updater) => async (args: ThemeSettings) => {
        updater(localStore, args);
        return mutate(args);
      };

      return mutate;
    });
  });

  it("renders a loading skeleton while preferences load", () => {
    useQueryMock.mockReturnValueOnce(undefined);

    render(<ThemeTab />);

    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
  });

  it("renders the current preferences", async () => {
    render(<ThemeTab />);

    expect(await screen.findByLabelText("Light")).toBeChecked();
    expect(await screen.findByLabelText("Cross")).toBeChecked();
  });

  it("updates the theme mode optimistically", async () => {
    render(<ThemeTab />);

    const darkOption = await screen.findByLabelText("Dark");
    await act(async () => {
      fireEvent.click(darkOption);
    });

    expect(setThemeMock).toHaveBeenCalledWith("dark");
    expect(setBackgroundPatternMock).toHaveBeenCalledWith("cross");
    expect(mutationCalls).toHaveLength(1);
    expect(mutationCalls[0]).toEqual({
      mode: "dark",
      backgroundPattern: "cross",
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("updates the background pattern optimistically", async () => {
    render(<ThemeTab />);

    const dotsOption = await screen.findByLabelText("Dots");
    await act(async () => {
      fireEvent.click(dotsOption);
    });

    expect(setBackgroundPatternMock).toHaveBeenCalledWith("dots");
    expect(mutationCalls).toHaveLength(1);
    expect(mutationCalls[0]).toEqual({
      mode: "light",
      backgroundPattern: "dots",
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });
});

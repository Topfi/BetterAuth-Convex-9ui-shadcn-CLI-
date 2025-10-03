import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LocalizationTab from "./LocalizationTab";
import { defaultLocalizationSettings } from "@/shared/settings/localization";

const useQueryMock = vi.fn();
const useMutationMock = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (query: unknown) => useQueryMock(query),
  useMutation: (mutation: unknown) => useMutationMock(mutation),
}));

describe("LocalizationTab", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useMutationMock.mockReset();

    useMutationMock.mockImplementation(() => {
      const mutate = vi.fn().mockResolvedValue(undefined);
      (
        mutate as typeof mutate & {
          withOptimisticUpdate: typeof mutate;
        }
      ).withOptimisticUpdate = vi.fn(() => mutate);
      return mutate;
    });

    useQueryMock.mockReturnValue(defaultLocalizationSettings);

    if (!("supportedValuesOf" in Intl)) {
      Object.defineProperty(Intl, "supportedValuesOf", {
        configurable: true,
        value: () => ["UTC", "Europe/Berlin"],
      });
    }
  });

  it("renders a loading skeleton while fetching preferences", () => {
    useQueryMock.mockReturnValue(undefined);

    const { container } = render(<LocalizationTab />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it("renders localization controls when preferences load", async () => {
    const { container } = render(<LocalizationTab />);

    expect(await screen.findByText("Localization")).toBeInTheDocument();
    expect(container.textContent?.includes("Time zone")).toBeTruthy();
    expect(await screen.findByText("Date format")).toBeInTheDocument();
    expect(await screen.findByText("Time format")).toBeInTheDocument();
    const comboboxes = await screen.findAllByRole("combobox");
    expect(comboboxes).toHaveLength(2);
    expect(comboboxes[0]).not.toHaveAttribute("data-disabled");
    expect(
      comboboxes[1].getAttribute("data-disabled") === "" ||
        comboboxes[1].getAttribute("aria-disabled") === "true",
    ).toBeTruthy();
  });

  it("updates the time format when a radio option is selected", async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);
    (
      mutate as typeof mutate & {
        withOptimisticUpdate: typeof mutate;
      }
    ).withOptimisticUpdate = vi.fn(() => mutate);
    useMutationMock.mockReturnValue(mutate);

    render(<LocalizationTab />);

    const [option] = await screen.findAllByRole("radio", {
      name: "24-hour",
    });
    fireEvent.click(option);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        ...defaultLocalizationSettings,
        timeFormat: "twentyFourHour",
      });
    });
  });

  it("updates the date format when a radio option is selected", async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);
    (
      mutate as typeof mutate & {
        withOptimisticUpdate: typeof mutate;
      }
    ).withOptimisticUpdate = vi.fn(() => mutate);
    useMutationMock.mockReturnValue(mutate);

    render(<LocalizationTab />);

    const [option] = await screen.findAllByRole("radio", {
      name: "ISO 8601",
    });
    fireEvent.click(option);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        ...defaultLocalizationSettings,
        dateFormat: "iso8601",
      });
    });
  });

  it("updates the show seconds toggle", async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);
    (
      mutate as typeof mutate & {
        withOptimisticUpdate: typeof mutate;
      }
    ).withOptimisticUpdate = vi.fn(() => mutate);
    useMutationMock.mockReturnValue(mutate);

    render(<LocalizationTab />);

    const toggle = await screen.findByRole("switch", { name: "Show seconds" });

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        ...defaultLocalizationSettings,
        showSeconds: false,
      });
    });
  });
});

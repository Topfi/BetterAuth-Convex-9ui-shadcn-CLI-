import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiStub = vi.hoisted(() => ({
  api: {
    settings_privacy: {
      requestExport: Symbol("settings_privacy.requestExport"),
      purgeAccount: Symbol("settings_privacy.purgeAccount"),
    },
  },
}));

vi.mock("@/convex/api", () => apiStub);

import PrivacyTab from "./PrivacyTab";

const { api } = apiStub;

const mocks = vi.hoisted(() => ({
  requestExportMock: vi.fn(),
  purgeAccountMock: vi.fn(),
  deleteUserMock: vi.fn(),
  navigateMock: vi.fn(),
  toastInfoMock: vi.fn(),
  toastErrorMock: vi.fn(),
  mutationMap: new Map<unknown, (...args: unknown[]) => unknown>(),
}));

vi.mock("convex/react", () => ({
  useMutation: (mutation: unknown) => {
    if (mocks.mutationMap.has(mutation)) {
      return mocks.mutationMap.get(mutation)!;
    }

    const fallback = vi.fn();
    const resolvedHandler =
      mutation === api.settings_privacy.requestExport
        ? mocks.requestExportMock
        : mutation === api.settings_privacy.purgeAccount
          ? mocks.purgeAccountMock
          : fallback;

    mocks.mutationMap.set(mutation, resolvedHandler);
    return resolvedHandler;
  },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    deleteUser: mocks.deleteUserMock,
  },
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    info: mocks.toastInfoMock,
    error: mocks.toastErrorMock,
    success: vi.fn(),
    warning: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    close: vi.fn(),
    promise: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useNavigate: () => mocks.navigateMock,
  };
});

describe("PrivacyTab", () => {
  beforeEach(() => {
    mocks.requestExportMock.mockReset();
    mocks.purgeAccountMock.mockReset();
    mocks.deleteUserMock.mockReset();
    mocks.navigateMock.mockReset();
    mocks.toastInfoMock.mockReset();
    mocks.toastErrorMock.mockReset();
    mocks.mutationMap.clear();
    window.matchMedia = vi.fn(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(() => false),
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    cleanup();
  });

  it("disables deletion until the username is confirmed", () => {
    render(
      <PrivacyTab
        identity={{ usernameDisplay: "Person", usernameLower: "person" }}
      />,
    );

    const deleteButton = screen.getByRole("button", {
      name: /delete account/i,
    });
    const input = screen.getByLabelText(/type/i);

    expect(deleteButton).toBeDisabled();

    fireEvent.change(input, { target: { value: "Someone else" } });
    expect(deleteButton).toBeDisabled();

    fireEvent.change(input, { target: { value: "Person" } });
    expect(deleteButton).toBeEnabled();
  });

  it("purges the account before deleting and navigates away", async () => {
    mocks.purgeAccountMock.mockResolvedValue({ success: true });
    mocks.deleteUserMock.mockResolvedValue(undefined);

    render(
      <PrivacyTab
        identity={{ usernameDisplay: "Person", usernameLower: "person" }}
      />,
    );

    const mutationHandlers = Array.from(mocks.mutationMap.values());
    expect(mutationHandlers).toContain(mocks.requestExportMock);
    expect(mutationHandlers).toContain(mocks.purgeAccountMock);

    const confirmationInput = screen.getByLabelText(/type/i);
    const deleteButton = screen.getByRole("button", {
      name: /delete account/i,
    });

    fireEvent.change(confirmationInput, {
      target: { value: "Person" },
    });

    await waitFor(() => {
      expect(deleteButton).toBeEnabled();
    });

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mocks.purgeAccountMock).toHaveBeenCalledWith({});
      expect(mocks.deleteUserMock).toHaveBeenCalled();
      expect(mocks.toastErrorMock).toHaveBeenCalled();
      expect(mocks.navigateMock).toHaveBeenCalledWith("/sign-in");
    });

    expect(mocks.purgeAccountMock.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteUserMock.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("shows a toast when scheduling an export", async () => {
    mocks.requestExportMock.mockResolvedValue({ status: "scheduled" });

    render(<PrivacyTab identity={null} />);

    const mutationHandlers = Array.from(mocks.mutationMap.values());
    expect(mutationHandlers).toContain(mocks.requestExportMock);
    expect(mutationHandlers).toContain(mocks.purgeAccountMock);

    const exportButton = screen.getByRole("button", {
      name: /request account export/i,
    });

    expect(exportButton).toBeEnabled();

    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mocks.requestExportMock).toHaveBeenCalledWith({});
      expect(mocks.toastInfoMock).toHaveBeenCalled();
    });
  });
});

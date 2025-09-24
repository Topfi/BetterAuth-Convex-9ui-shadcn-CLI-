import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { COMPROMISED_PASSPHRASE_MESSAGE } from "@/shared/passphrase-strength";

const themeProviderModule = vi.hoisted(() => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/providers/theme-provider", () => themeProviderModule, {
  virtual: true,
});

const { ThemeProvider } = themeProviderModule;
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
});

import SecurityTab from "./SecurityTab";

const useQueryMock = vi.fn();
const rotatePassphraseMock = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (query: unknown) => useQueryMock(query),
  useMutation: () => rotatePassphraseMock,
}));

const generatePassphraseMock = vi.fn();
const copyPassphraseToClipboardMock = vi.fn();

vi.mock("@/lib/passphrase", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/passphrase")>(
      "@/lib/passphrase",
    );
  return {
    ...actual,
    generatePassphrase: () => generatePassphraseMock(),
    copyPassphraseToClipboard: (value: string) =>
      copyPassphraseToClipboardMock(value),
  };
});

describe("SecurityTab", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useQueryMock.mockReset();
    rotatePassphraseMock.mockReset();
    generatePassphraseMock.mockReset();
    copyPassphraseToClipboardMock.mockReset();
  });

  const renderTab = () =>
    render(
      <ThemeProvider>
        <SecurityTab />
      </ThemeProvider>,
    );

  it("shows a clear status indicator when there are no risks", () => {
    useQueryMock.mockReturnValue({
      hasPassphrase: true,
      twoFactorEnabled: true,
      risks: [],
    });

    renderTab();

    const indicator = screen.getByRole("status", {
      name: /account security status/i,
    });

    expect(indicator).toHaveTextContent("Security status: All clear");
    expect(indicator).toHaveAttribute("data-traffic-light", "success");
    expect(
      screen.queryByText(/Resolve the following/i),
    ).not.toBeInTheDocument();
  });

  it("elevates to high risk indicator when risks are present", () => {
    useQueryMock.mockReturnValue({
      hasPassphrase: true,
      twoFactorEnabled: false,
      risks: [
        {
          id: "2fa",
          level: "high",
          message: "Enable two-factor authentication to protect your account.",
        },
      ],
    });

    renderTab();

    const indicator = screen.getByRole("status", {
      name: /account security status/i,
    });

    expect(indicator).toHaveTextContent("Security status: High risk");
    expect(indicator).toHaveAttribute("data-traffic-light", "danger");
    expect(
      screen.getByText(
        /Enable two-factor authentication to protect your account./i,
      ),
    ).toBeInTheDocument();
  });

  it("generates and autofills a strong passphrase", async () => {
    useQueryMock.mockReturnValue({
      hasPassphrase: true,
      twoFactorEnabled: false,
      risks: [],
    });
    generatePassphraseMock.mockReturnValue("S3cur3Passphrase!");
    rotatePassphraseMock.mockResolvedValue({ ok: true });

    renderTab();

    fireEvent.click(
      screen.getByRole("button", { name: /generate strong passphrase/i }),
    );

    expect(generatePassphraseMock).toHaveBeenCalled();
    expect(copyPassphraseToClipboardMock).toHaveBeenCalledWith(
      "S3cur3Passphrase!",
    );

    const passphraseInput = screen.getByLabelText(
      /New passphrase/i,
    ) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(
      /Confirm passphrase/i,
    ) as HTMLInputElement;

    expect(passphraseInput.value).toBe("S3cur3Passphrase!");
    expect(confirmInput.value).toBe("S3cur3Passphrase!");

    fireEvent.click(
      screen.getByRole("button", { name: /save new passphrase/i }),
    );

    await waitFor(() => {
      expect(rotatePassphraseMock).toHaveBeenCalledWith({
        passphrase: "S3cur3Passphrase!",
      });
    });
  });

  it("shows passphrase strength feedback while typing", async () => {
    useQueryMock.mockReturnValue({
      hasPassphrase: true,
      twoFactorEnabled: false,
      risks: [],
    });
    rotatePassphraseMock.mockResolvedValue({ ok: true });

    renderTab();

    const passphraseField = screen.getByLabelText(/New passphrase/i);

    fireEvent.change(passphraseField, {
      target: { value: "aaaaaaa" },
    });

    expect(
      await screen.findByText("Passphrase strength: very weak"),
    ).toBeInTheDocument();

    fireEvent.change(passphraseField, {
      target: { value: "library-quiet-yellow-planet-92" },
    });

    expect(
      await screen.findByText("Passphrase strength: excellent"),
    ).toBeInTheDocument();
  });

  it("surfaces breach check failures from the rotation mutation", async () => {
    useQueryMock.mockReturnValue({
      hasPassphrase: true,
      twoFactorEnabled: false,
      risks: [],
    });
    rotatePassphraseMock.mockRejectedValue(
      new Error(COMPROMISED_PASSPHRASE_MESSAGE),
    );

    renderTab();

    fireEvent.change(screen.getByLabelText(/New passphrase/i), {
      target: { value: "library-quiet-yellow-planet-92" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm passphrase/i), {
      target: { value: "library-quiet-yellow-planet-92" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /save new passphrase/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(COMPROMISED_PASSPHRASE_MESSAGE),
      ).toBeInTheDocument();
    });
  });

  it("renders the preview card when passphrase login is not enabled", () => {
    useQueryMock.mockReturnValue({
      hasPassphrase: false,
      twoFactorEnabled: false,
      risks: [],
    });

    renderTab();

    expect(
      screen.getByText((content) =>
        content.includes(
          "You currently sign in with magic links and trusted providers",
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("reveals 2FA placeholders when the user has a passphrase", () => {
    useQueryMock.mockReturnValue({
      hasPassphrase: true,
      twoFactorEnabled: false,
      risks: [],
    });

    renderTab();

    expect(
      screen.getByRole("switch", { name: /Enable authenticator app/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("switch", { name: /Manage backup codes/i }),
    ).toBeDisabled();
  });
});

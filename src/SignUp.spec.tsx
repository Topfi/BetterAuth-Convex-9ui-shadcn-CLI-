import "@testing-library/jest-dom/vitest";
import {
  useEffect,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import SignUp from "@/SignUp";
import { ThemeProvider } from "@/providers/theme-provider";
import { COMPROMISED_PASSPHRASE_MESSAGE } from "@/shared/passphrase-strength";

type PublicConfig = {
  githubOAuth: boolean;
  githubErrors: readonly string[];
  googleOAuth: boolean;
  googleErrors: readonly string[];
  appleOAuth: boolean;
  appleErrors: readonly string[];
  passphraseSignIn: boolean;
  passphraseSignUp: boolean;
  magicLinkSignIn: boolean;
  verificationCodeSignIn: boolean;
};

const publicConfigState: { value: PublicConfig } = {
  value: {
    githubOAuth: false,
    githubErrors: [],
    googleOAuth: false,
    googleErrors: [],
    appleOAuth: false,
    appleErrors: [],
    passphraseSignIn: true,
    passphraseSignUp: true,
    magicLinkSignIn: true,
    verificationCodeSignIn: true,
  },
};

const useConvexAuthMock = vi.fn();
const {
  signUpEmailMock,
  toastSuccessMock,
  toastErrorMock,
  toastInfoMock,
  stagePendingIdentityMock,
  clipboardWriteTextMock,
} = vi.hoisted(() => ({
  signUpEmailMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastInfoMock: vi.fn(),
  stagePendingIdentityMock: vi.fn(),
  clipboardWriteTextMock: vi.fn(),
}));

vi.mock("convex/react", async () => {
  const actual =
    await vi.importActual<typeof import("convex/react")>("convex/react");
  return {
    ...actual,
    useConvexAuth: () => useConvexAuthMock(),
    useMutation: () => stagePendingIdentityMock,
    useQuery: () => publicConfigState.value,
  };
});

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: signUpEmailMock,
    },
  },
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
    info: toastInfoMock,
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: ButtonMockProps) => (
    <button {...props}>{children}</button>
  ),
}));

type ButtonMockProps = ComponentPropsWithoutRef<"button"> & {
  children: ReactNode;
};

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

function renderWithProviders(
  ui: ReactNode,
  { initialEntries = ["/sign-up"] }: { initialEntries?: string[] } = {},
) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  useConvexAuthMock.mockReset();
  signUpEmailMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  toastInfoMock.mockReset();
  stagePendingIdentityMock.mockReset();
  clipboardWriteTextMock.mockReset();
  signUpEmailMock.mockResolvedValue({
    data: { user: { id: "pending_user" } },
    error: null,
  });
  stagePendingIdentityMock.mockResolvedValue({ ok: true });
  publicConfigState.value = {
    githubOAuth: false,
    githubErrors: [],
    googleOAuth: false,
    googleErrors: [],
    appleOAuth: false,
    appleErrors: [],
    passphraseSignIn: true,
    passphraseSignUp: true,
    magicLinkSignIn: true,
    verificationCodeSignIn: true,
  };
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
  localStorage.clear();
  Object.defineProperty(window.navigator, "clipboard", {
    value: {
      writeText: clipboardWriteTextMock,
    },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
});

describe("SignUp", () => {
  it("redirects authenticated users to the workspace", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    let currentPath = "/sign-up";

    renderWithProviders(
      <>
        <LocationObserver onChange={(pathname) => (currentPath = pathname)} />
        <Routes>
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/workspace" element={<div>workspace</div>} />
        </Routes>
      </>,
    );

    await waitFor(() => {
      expect(currentPath).toBe("/workspace");
    });
  });

  it("renders the theme toggle for unauthenticated pages", () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    );

    expect(
      screen.getByRole("button", {
        name: /Switch to (dark|light) mode/,
      }),
    ).toBeInTheDocument();
  });

  it("prevents sign up with invalid email or short passphrase", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "AdaLovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText("Passphrase"), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText("Confirm passphrase"), {
      target: { value: "short" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();

    const passphraseErrors = await screen.findAllByText(
      "Passphrase must be at least 8 characters.",
    );
    expect(passphraseErrors).toHaveLength(2);
    expect(signUpEmailMock).not.toHaveBeenCalled();
    expect(stagePendingIdentityMock).not.toHaveBeenCalled();
    expect(signUpEmailMock).not.toHaveBeenCalled();
  });

  it("shows real-time passphrase strength feedback", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    );

    const passphraseField = screen.getByLabelText("Passphrase");

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

  it("surfaces compromised passphrase errors from the server", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    signUpEmailMock.mockResolvedValue({
      data: null,
      error: { message: COMPROMISED_PASSPHRASE_MESSAGE },
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "AdaLovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Passphrase"), {
      target: { value: "library-quiet-yellow-planet-92" },
    });
    fireEvent.change(screen.getByLabelText("Confirm passphrase"), {
      target: { value: "library-quiet-yellow-planet-92" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText(COMPROMISED_PASSPHRASE_MESSAGE),
    ).toBeInTheDocument();
  });

  it("requires matching passphrases", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "AdaLovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Passphrase"), {
      target: { value: "correct horse battery" },
    });
    fireEvent.change(screen.getByLabelText("Confirm passphrase"), {
      target: { value: "different battery" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(
        screen.getByText("Passphrases must match before continuing."),
      ).toBeInTheDocument();
    });
    expect(signUpEmailMock).not.toHaveBeenCalled();
    expect(stagePendingIdentityMock).not.toHaveBeenCalled();
  });

  it("validates selected profile image", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    );

    const imageInput = screen.getByLabelText("Profile image (optional)");
    const invalidFile = new File(["binary"], "avatar.gif", {
      type: "image/gif",
    });

    fireEvent.change(imageInput, {
      target: { files: [invalidFile] },
    });

    await waitFor(() => {
      expect(
        screen.getByText("Profile image must be a PNG or JPEG."),
      ).toBeInTheDocument();
    });
  });

  it("surfaces server errors in the form", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    signUpEmailMock.mockImplementation(async (_values, options) => {
      options?.onRequest?.();
      options?.onError?.({ error: { message: "Email already in use." } });
      return { data: null, error: { message: "Email already in use." } };
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "AdaLovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Passphrase"), {
      target: { value: "correct horse battery" },
    });
    fireEvent.change(screen.getByLabelText("Confirm passphrase"), {
      target: { value: "correct horse battery" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Email already in use.")).toBeInTheDocument();
    });
    expect(toastErrorMock).toHaveBeenCalledWith("Email already in use.");
    expect(stagePendingIdentityMock).not.toHaveBeenCalled();
  });

  it("submits successfully with valid input", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    let currentPath = "/sign-up";

    renderWithProviders(
      <>
        <LocationObserver onChange={(pathname) => (currentPath = pathname)} />
        <Routes>
          <Route path="/sign-up" element={<SignUp />} />
          <Route
            path="/auth/pending-verification"
            element={<div>pending verification</div>}
          />
        </Routes>
      </>,
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "AdaLovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Passphrase"), {
      target: { value: "correct horse battery" },
    });
    fireEvent.change(screen.getByLabelText("Confirm passphrase"), {
      target: { value: "correct horse battery" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(signUpEmailMock).toHaveBeenCalledTimes(1);
    });

    const expectedCallback = new URL(
      "/auth/verification-success",
      window.location.origin,
    ).toString();

    expect(signUpEmailMock.mock.calls[0]?.[0]).toMatchObject({
      email: "ada@example.com",
      password: "correct horse battery",
      name: "AdaLovelace",
      callbackURL: expectedCallback,
    });
    expect(signUpEmailMock.mock.calls[0]?.[0].image).toBeUndefined();
    await waitFor(() => {
      expect(stagePendingIdentityMock).toHaveBeenCalledWith({
        betterAuthUserId: "pending_user",
        email: "ada@example.com",
        username: "AdaLovelace",
        imageBase64: undefined,
      });
    });
    expect(toastInfoMock).toHaveBeenCalledWith(
      "Check your email to verify your account within 24 hours.",
    );
    await waitFor(() => {
      expect(currentPath).toBe("/auth/pending-verification");
    });
  });

  it("shows a helpful error when username conflict occurs", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    stagePendingIdentityMock.mockRejectedValueOnce(
      new Error("That username is taken. Try another."),
    );

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "AdaLovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Passphrase"), {
      target: { value: "correct horse battery" },
    });
    fireEvent.change(screen.getByLabelText("Confirm passphrase"), {
      target: { value: "correct horse battery" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(signUpEmailMock).toHaveBeenCalled();
    });
    expect(
      await screen.findByText("That username is taken. Try another."),
    ).toBeInTheDocument();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("generates and applies a passphrase to both fields", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(toastInfoMock).toHaveBeenCalledWith(
        "Generated passphrase copied to your clipboard.",
      );
    });

    const passphraseInput = screen.getByLabelText(
      "Passphrase",
    ) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(
      "Confirm passphrase",
    ) as HTMLInputElement;

    await waitFor(() => {
      expect(passphraseInput.value).toHaveLength(24);
    });
    expect(confirmInput.value).toBe(passphraseInput.value);

    await waitFor(() => {
      expect(clipboardWriteTextMock).toHaveBeenCalledWith(
        passphraseInput.value,
      );
    });
  });

  it("reveals the passphrase for five seconds before hiding again", async () => {
    vi.useFakeTimers();
    try {
      useConvexAuthMock.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithProviders(
        <Routes>
          <Route path="/sign-up" element={<SignUp />} />
        </Routes>,
      );

      const passphraseInput = screen.getByLabelText(
        "Passphrase",
      ) as HTMLInputElement;
      fireEvent.change(passphraseInput, {
        target: { value: "SamplePassphrase123" },
      });

      const [revealButton] = screen.getAllByRole("button", {
        name: "Show passphrase",
      });

      fireEvent.click(revealButton);
      expect(passphraseInput.type).toBe("text");
      expect(revealButton).toHaveAttribute(
        "aria-label",
        "Extend passphrase visibility",
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4999);
      });
      expect(passphraseInput.type).toBe("text");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(passphraseInput.type).toBe("password");
      expect(revealButton).toHaveAttribute("aria-label", "Show passphrase");

      fireEvent.click(revealButton);
      expect(passphraseInput.type).toBe("text");
      expect(revealButton).toHaveAttribute(
        "aria-label",
        "Extend passphrase visibility",
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4999);
      });
      expect(passphraseInput.type).toBe("text");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(passphraseInput.type).toBe("password");
      expect(revealButton).toHaveAttribute("aria-label", "Show passphrase");
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders a disabled notice when passphrase sign-up is turned off", () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    publicConfigState.value = {
      ...publicConfigState.value,
      passphraseSignUp: false,
    };

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    );

    expect(
      screen.getByText("Sign up is currently disabled."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Username")).not.toBeInTheDocument();
  });
});

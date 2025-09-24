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
import SignIn from "@/SignIn";
import { ThemeProvider } from "@/providers/theme-provider";

type PublicConfig = {
  githubOAuth: boolean;
  githubErrors: readonly string[];
  googleOAuth: boolean;
  googleErrors: readonly string[];
  appleOAuth: boolean;
  appleErrors: readonly string[];
};

const useConvexAuthMock = vi.fn();
const publicConfigState: { value: PublicConfig } = {
  value: {
    githubOAuth: false,
    githubErrors: [],
    googleOAuth: false,
    googleErrors: [],
    appleOAuth: false,
    appleErrors: [],
  },
};

const {
  signInEmailMock,
  signInMagicLinkMock,
  signInEmailOtpMock,
  signInSocialMock,
  sendVerificationOtpMock,
  forgetPasswordMock,
  toastSuccessMock,
  toastErrorMock,
  toastInfoMock,
  signInWithGithubMock,
} = vi.hoisted(() => ({
  signInEmailMock: vi.fn(),
  signInMagicLinkMock: vi.fn(),
  signInEmailOtpMock: vi.fn(),
  signInSocialMock: vi.fn(),
  sendVerificationOtpMock: vi.fn(),
  forgetPasswordMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastInfoMock: vi.fn(),
  signInWithGithubMock: vi.fn(),
}));

vi.mock("convex/react", async () => {
  const actual =
    await vi.importActual<typeof import("convex/react")>("convex/react");
  return {
    ...actual,
    useConvexAuth: () => useConvexAuthMock(),
    useQuery: () => publicConfigState.value,
  };
});

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: signInEmailMock,
      magicLink: signInMagicLinkMock,
      emailOtp: signInEmailOtpMock,
      social: signInSocialMock,
    },
    emailOtp: {
      sendVerificationOtp: sendVerificationOtpMock,
    },
    forgetPassword: forgetPasswordMock,
  },
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
    info: toastInfoMock,
  },
}));

vi.mock("./lib/github-auth", () => ({
  signInWithGitHub: signInWithGithubMock,
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
  { initialEntries = ["/sign-in"] }: { initialEntries?: string[] } = {},
) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  useConvexAuthMock.mockReset();
  signInEmailMock.mockReset();
  signInMagicLinkMock.mockReset();
  signInEmailOtpMock.mockReset();
  signInSocialMock.mockReset();
  sendVerificationOtpMock.mockReset();
  forgetPasswordMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  toastInfoMock.mockReset();
  signInWithGithubMock.mockReset();
  signInEmailMock.mockResolvedValue({ data: null, error: null });
  signInWithGithubMock.mockResolvedValue(undefined);

  publicConfigState.value = {
    githubOAuth: false,
    githubErrors: [],
    googleOAuth: false,
    googleErrors: [],
    appleOAuth: false,
    appleErrors: [],
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
});

afterEach(() => {
  cleanup();
});

describe("SignIn", () => {
  it("redirects authenticated users to the workspace", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    let currentPath = "/sign-in";

    renderWithProviders(
      <>
        <LocationObserver onChange={(pathname) => (currentPath = pathname)} />
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
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
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
    );

    expect(
      screen.getByRole("button", {
        name: /Switch to (dark|light) mode/,
      }),
    ).toBeInTheDocument();
  });

  it("prevents passphrase sign-in when fields are invalid", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Use a passphrase instead",
      }),
    );

    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(emailInput, { target: { value: "invalid" } });

    const passphraseInput = screen.getByLabelText("Passphrase");
    fireEvent.change(passphraseInput, { target: { value: "short" } });

    fireEvent.click(
      screen.getByRole("button", { name: "Sign in with passphrase" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Enter a valid email address."),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Passphrase must be at least 8 characters."),
    ).toBeInTheDocument();
    expect(signInEmailMock).not.toHaveBeenCalled();
  });

  it("requests a magic link with the verification success callback", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    signInMagicLinkMock.mockImplementation(async (_values, options) => {
      options?.onRequest?.();
      options?.onSuccess?.();
      return { data: null, error: null };
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    await waitFor(() => {
      const expectedCallback = new URL(
        "/auth/verification-success",
        window.location.origin,
      ).toString();
      expect(signInMagicLinkMock).toHaveBeenCalledWith(
        {
          email: "user@example.com",
          callbackURL: expectedCallback,
        },
        expect.any(Object),
      );
    });
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Check your email for the magic link!",
    );
  });

  it("requests an OTP with the verification success callback", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    sendVerificationOtpMock.mockImplementation(async (_values, options) => {
      options?.onRequest?.();
      options?.onSuccess?.();
      return { data: null, error: null };
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Send verification code" }),
    );

    await waitFor(() => {
      const expectedCallback = new URL(
        "/auth/verification-success",
        window.location.origin,
      ).toString();
      expect(sendVerificationOtpMock).toHaveBeenCalledWith(
        {
          email: "user@example.com",
          type: "sign-in",
          callbackURL: expectedCallback,
        },
        expect.any(Object),
      );
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("reveals the sign-in passphrase for five seconds before hiding", async () => {
    vi.useFakeTimers();
    try {
      useConvexAuthMock.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithProviders(
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
        </Routes>,
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: "Use a passphrase instead",
        }),
      );

      const passphraseInput = screen.getByLabelText(
        "Passphrase",
      ) as HTMLInputElement;
      fireEvent.change(passphraseInput, {
        target: { value: "MySecretPassphrase123" },
      });

      const revealButton = screen.getByRole("button", {
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
    } finally {
      vi.useRealTimers();
    }
  });

  it("surfaces server errors as field feedback", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    signInEmailMock.mockImplementation(async (_values, options) => {
      options?.onRequest?.();
      options?.onError?.({ error: { message: "Invalid credentials." } });
      return { data: null, error: { message: "Invalid credentials." } };
    });

    renderWithProviders(
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Use a passphrase instead",
      }),
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Passphrase"), {
      target: { value: "passphrase" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Sign in with passphrase" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials.")).toBeInTheDocument();
    });

    expect(signInEmailMock).toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith("Invalid credentials.");
  });

  it("redirects users with unverified email to the pending verification page", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    signInEmailMock.mockImplementation(async (_values, options) => {
      options?.onRequest?.();
      options?.onError?.({ error: { message: "Email not verified" } });
      return { data: null, error: { message: "Email not verified" } };
    });

    let currentPath = "/sign-in";

    renderWithProviders(
      <>
        <LocationObserver onChange={(pathname) => (currentPath = pathname)} />
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route
            path="/auth/pending-verification"
            element={<div>pending verification</div>}
          />
        </Routes>
      </>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Use a passphrase instead",
      }),
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Passphrase"), {
      target: { value: "passphrase" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Sign in with passphrase" }),
    );

    await waitFor(() => {
      expect(toastInfoMock).toHaveBeenCalledWith(
        "Verify your email to continue. We saved your details for 24 hours.",
      );
    });
    await waitFor(() => {
      expect(currentPath).toBe("/auth/pending-verification");
    });
  });

  it("triggers GitHub social sign-in when enabled", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    publicConfigState.value = {
      ...publicConfigState.value,
      githubOAuth: true,
      githubErrors: [],
    };
    signInWithGithubMock.mockResolvedValueOnce(undefined);

    renderWithProviders(
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Sign in with GitHub" }),
    );

    await waitFor(() => {
      expect(signInWithGithubMock).toHaveBeenCalledTimes(1);
    });
  });

  it("disables GitHub button and surfaces errors when misconfigured", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    publicConfigState.value = {
      ...publicConfigState.value,
      githubOAuth: true,
      githubErrors: ["GitHub OAuth client secret is required."],
    };

    renderWithProviders(
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
    );

    const githubButton = screen.getByRole("button", {
      name: /GitHub sign-in unavailable/,
    });
    expect(githubButton).toBeDisabled();
    expect(toastErrorMock).toHaveBeenCalledWith(
      "GitHub OAuth client secret is required.",
    );
    expect(signInWithGithubMock).not.toHaveBeenCalled();
  });

  it("triggers Google social sign-in when enabled", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    publicConfigState.value = {
      ...publicConfigState.value,
      googleOAuth: true,
      googleErrors: [],
    };

    renderWithProviders(
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Sign in with Google" }),
    );

    expect(signInSocialMock).toHaveBeenCalledWith(
      { provider: "google" },
      expect.any(Object),
    );
  });

  it("disables Google button and surfaces errors when misconfigured", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    publicConfigState.value = {
      ...publicConfigState.value,
      googleOAuth: true,
      googleErrors: ["Google OAuth client ID missing."],
    };

    renderWithProviders(
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
    );

    expect(
      screen.getByRole("button", { name: /Google sign-in unavailable/ }),
    ).toBeDisabled();
    expect(toastErrorMock).toHaveBeenCalledWith(
      "Google OAuth client ID missing.",
    );
    expect(signInSocialMock).not.toHaveBeenCalled();
  });

  it("triggers Apple social sign-in when enabled", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    publicConfigState.value = {
      ...publicConfigState.value,
      appleOAuth: true,
      appleErrors: [],
    };

    renderWithProviders(
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign in with Apple" }));

    expect(signInSocialMock).toHaveBeenCalledWith(
      { provider: "apple" },
      expect.any(Object),
    );
  });

  it("disables Apple button and surfaces errors when misconfigured", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    publicConfigState.value = {
      ...publicConfigState.value,
      appleOAuth: true,
      appleErrors: ["Apple OAuth client secret missing."],
    };

    renderWithProviders(
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
    );

    expect(
      screen.getByRole("button", { name: /Apple sign-in unavailable/ }),
    ).toBeDisabled();
    expect(toastErrorMock).toHaveBeenCalledWith(
      "Apple OAuth client secret missing.",
    );
    expect(signInSocialMock).not.toHaveBeenCalled();
  });
});

import "@testing-library/jest-dom/vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/providers/theme-provider";
import { USERNAME_TAKEN_ERROR } from "../../../../shared/identity";
import ProfileTab, { type ProfileTabProps } from "./ProfileTab";

const updateUsernameMock = vi.hoisted(() => vi.fn());
const requestEmailChangeMock = vi.hoisted(() => vi.fn());
const updateProfileImageMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const toastInfoMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

let mutationCallCount = 0;

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => {
    const mocks = [
      updateUsernameMock,
      requestEmailChangeMock,
      updateProfileImageMock,
    ];
    const mock = mocks[mutationCallCount % mocks.length] ?? vi.fn();
    mutationCallCount += 1;
    return mock;
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: signOutMock,
  },
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    info: toastInfoMock,
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

vi.mock("@/lib/image", () => ({
  convertImageToBase64: vi.fn(async () => "data:image/png;base64,Zm9v"),
}));

describe("ProfileTab", () => {
  const baseProps: ProfileTabProps = {
    currentUser: {
      email: "person@example.com",
      image: null,
      name: "Person",
    },
    identity: {
      usernameDisplay: "Person",
      usernameLower: "person",
    },
  };

  beforeEach(() => {
    mutationCallCount = 0;
    updateUsernameMock.mockReset();
    requestEmailChangeMock.mockReset();
    updateProfileImageMock.mockReset();
    signOutMock.mockReset();
    toastInfoMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
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

  it("surfaces username conflicts returned from the server", async () => {
    updateUsernameMock.mockRejectedValue(new Error(USERNAME_TAKEN_ERROR));

    render(
      <ThemeProvider>
        <ProfileTab {...baseProps} />
      </ThemeProvider>,
    );

    const usernameForm = screen.getAllByTestId("username-form")[0];
    const usernameInput = within(usernameForm).getByRole("textbox");
    fireEvent.change(usernameInput, { target: { value: "Ada" } });

    fireEvent.submit(usernameForm);
    await new Promise((resolve) => setTimeout(resolve, 0));

    await waitFor(() => {
      expect(updateUsernameMock).toHaveBeenCalled();
    });

    await screen.findByText(/that username is taken/i);
  });

  it("requests email changes after confirmation", async () => {
    requestEmailChangeMock.mockResolvedValue({ ok: true });

    render(
      <ThemeProvider>
        <ProfileTab {...baseProps} />
      </ThemeProvider>,
    );

    const emailForm = screen.getAllByTestId("email-form")[0];
    const emailInput = within(emailForm).getByRole("textbox");
    fireEvent.change(emailInput, { target: { value: "new@example.com" } });

    fireEvent.submit(emailForm);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const confirmButton = await screen.findByRole("button", {
      name: /confirm email change/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(requestEmailChangeMock).toHaveBeenCalledWith({
        email: "new@example.com",
      });
    });
    expect(signOutMock).toHaveBeenCalled();
    expect(toastInfoMock).toHaveBeenCalled();
  });

  it("validates profile image uploads", async () => {
    render(
      <ThemeProvider>
        <ProfileTab {...baseProps} />
      </ThemeProvider>,
    );

    const imageForm = screen.getAllByTestId("image-form")[0];
    const fileInput = imageForm.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    if (!fileInput) {
      throw new Error("Profile image input not found");
    }
    const invalidFile = new File(["hello"], "hello.txt", {
      type: "text/plain",
    });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    fireEvent.submit(imageForm);
    await new Promise((resolve) => setTimeout(resolve, 0));

    await waitFor(() => {
      expect(screen.getByText(/must be a png or jpeg/i)).toBeInTheDocument();
    });
  });
});

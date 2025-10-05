import { createBrowserRouter } from "react-router-dom";
import SignIn from "@/SignIn";
import SignUp from "@/SignUp";
import WorkspacePage from "@/routes/pages/WorkspacePage";
import ClaimUsernamePage from "@/routes/pages/ClaimUsernamePage";
import NotFoundPage from "@/routes/pages/NotFoundPage";
import TermsPage from "@/routes/pages/TermsPage";
import PrivacyPage from "@/routes/pages/PrivacyPage";
import { AuthGate, Protected } from "@/routes/guards";
import WorkspaceShell from "@/routes/layouts/WorkspaceShell";

export const routes = [
  {
    path: "/",
    Component: AuthGate,
  },
  {
    path: "/sign-in",
    Component: SignIn,
  },
  {
    path: "/sign-up",
    Component: SignUp,
  },
  {
    path: "/terms",
    Component: TermsPage,
  },
  {
    path: "/privacy",
    Component: PrivacyPage,
  },
  {
    path: "/auth/pending-verification",
    lazy: async () => ({
      Component: (await import("@/routes/pages/PendingVerificationPage"))
        .default,
    }),
  },
  {
    path: "/auth/verification-success",
    lazy: async () => ({
      Component: (await import("@/routes/pages/VerificationSuccessPage"))
        .default,
    }),
  },
  {
    path: "/workspace",
    Component: Protected,
    children: [
      {
        Component: WorkspaceShell,
        children: [
          {
            index: true,
            Component: WorkspacePage,
          },
          {
            path: "settings",
            lazy: async () => ({
              Component: (await import("@/routes/pages/WorkspaceSettingsPage"))
                .default,
            }),
          },
        ],
      },
    ],
  },
  {
    path: "/onboarding/username",
    Component: Protected,
    children: [
      {
        index: true,
        Component: ClaimUsernamePage,
      },
    ],
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
] satisfies Parameters<typeof createBrowserRouter>[0];

export const router = createBrowserRouter(routes);

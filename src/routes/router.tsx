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
import RootError from "@/routes/errors/RootError";

export const routes = [
  {
    path: "/",
    Component: AuthGate,
    errorElement: <RootError />,
  },
  {
    path: "/sign-in",
    Component: SignIn,
    errorElement: <RootError />,
  },
  {
    path: "/sign-up",
    Component: SignUp,
    errorElement: <RootError />,
  },
  {
    path: "/terms",
    Component: TermsPage,
    errorElement: <RootError />,
  },
  {
    path: "/privacy",
    Component: PrivacyPage,
    errorElement: <RootError />,
  },
  {
    path: "/auth/pending-verification",
    lazy: async () => ({
      Component: (await import("@/routes/pages/PendingVerificationPage"))
        .default,
    }),
    errorElement: <RootError />,
  },
  {
    path: "/auth/verification-success",
    lazy: async () => ({
      Component: (await import("@/routes/pages/VerificationSuccessPage"))
        .default,
    }),
    errorElement: <RootError />,
  },
  {
    path: "/workspace",
    Component: Protected,
    errorElement: <RootError />,
    children: [
      {
        Component: WorkspaceShell,
        errorElement: <RootError />,
        children: [
          {
            index: true,
            Component: WorkspacePage,
            errorElement: <RootError />,
          },
        ],
      },
    ],
  },
  {
    path: "/onboarding/username",
    Component: Protected,
    errorElement: <RootError />,
    children: [
      {
        index: true,
        Component: ClaimUsernamePage,
        errorElement: <RootError />,
      },
    ],
  },
  {
    path: "*",
    Component: NotFoundPage,
    errorElement: <RootError />,
  },
] satisfies Parameters<typeof createBrowserRouter>[0];

export const router = createBrowserRouter(routes);

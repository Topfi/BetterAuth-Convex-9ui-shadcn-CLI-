import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/providers/theme-provider";
import { authClient } from "@/lib/auth-client";
import { router } from "@/routes/router";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <ToastProvider>
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
          <RouterProvider router={router} />
        </ConvexBetterAuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);

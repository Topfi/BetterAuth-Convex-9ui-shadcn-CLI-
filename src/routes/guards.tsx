import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useConvexAuth, useQuery } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/providers/theme-context";
import { defaultThemeSettings } from "@/shared/settings/theme";
import { api } from "../../convex/_generated/api";

export function SessionFallback() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col transition-colors">
      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Skeleton className="h-10 w-10 rounded-full" />
            <span>Checking your session…</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export function Protected() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();
  const me = useQuery(api.identity.getMe, isAuthenticated ? {} : "skip");
  const themeSettings = useQuery(
    api.settings_theme.getPreferences,
    isAuthenticated ? {} : "skip",
  );
  const { theme, setTheme, backgroundPattern, setBackgroundPattern } =
    useTheme();

  useEffect(() => {
    if (themeSettings === undefined) {
      return;
    }

    const nextSettings = themeSettings ?? defaultThemeSettings;

    if (theme !== nextSettings.mode) {
      setTheme(nextSettings.mode);
    }

    if (backgroundPattern !== nextSettings.backgroundPattern) {
      setBackgroundPattern(nextSettings.backgroundPattern);
    }
  }, [backgroundPattern, setBackgroundPattern, setTheme, theme, themeSettings]);

  const loadingUser = isAuthenticated && me === undefined;
  if (isLoading || loadingUser) {
    return <SessionFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  if (me === null && !location.pathname.startsWith("/onboarding/username")) {
    return <Navigate to="/onboarding/username" replace />;
  }

  return <Outlet />;
}

export function AuthGate() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.identity.getMe, isAuthenticated ? {} : "skip");
  const loadingUser = isAuthenticated && me === undefined;

  if (isLoading || loadingUser) {
    return <SessionFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return me === null ? (
    <Navigate to="/onboarding/username" replace />
  ) : (
    <Navigate to="/workspace" replace />
  );
}

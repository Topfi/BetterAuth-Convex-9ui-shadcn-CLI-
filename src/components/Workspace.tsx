/**
 * PRE-FLIGHT: Follow AGENTS.md hard rules.
 * Workspace surface for managing account tools.
 */
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import Counter from "./Counter";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

export default function Workspace() {
  const navigate = useNavigate();
  const user = useQuery(api.auth.getCurrentUser);
  const me = useQuery(api.identity.getMe, {});

  const handleSignOut = () => {
    void authClient.signOut();
  };
  const handleOpenSettings = () => {
    navigate("/workspace/settings");
  };

  if (user === undefined || me === undefined) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!user || !me) {
    return null;
  }

  const resolvedEmail = user.email?.trim() || undefined;
  const displayName = me.usernameDisplay ?? resolvedEmail ?? "Account";
  const initials = (me.usernameDisplay ?? resolvedEmail ?? "?")
    .slice(0, 1)
    .toUpperCase();
  const emailLabel = resolvedEmail ?? "Email unavailable";

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and explore real-time features powered by Convex
          and Better Auth.
        </p>
      </header>

      <section>
        <Card className="border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  className="size-14 border"
                  role="img"
                  aria-label={displayName}
                >
                  {user.image ? (
                    <AvatarImage src={user.image} alt={displayName} />
                  ) : (
                    <AvatarFallback aria-hidden>{initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold leading-tight">
                    {displayName}
                  </h2>
                  <p className="text-sm text-muted-foreground">{emailLabel}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end w-full sm:w-auto">
                <ThemeToggle />
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    onClick={handleOpenSettings}
                  >
                    <SettingsIcon className="size-4" aria-hidden />
                    Settings
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="size-4" aria-hidden />
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0 space-y-6">
            <Separator />
            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold leading-tight">
                  Quick actions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try the counter below to see Convex mutations update in real
                  time.
                </p>
              </div>
              <div className="max-w-xl">
                <Counter />
              </div>
            </section>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

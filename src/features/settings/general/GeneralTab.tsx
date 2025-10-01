import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export type GeneralTabProps = {
  currentUser:
    | {
        email: string | null;
        image: string | null;
        name?: string | null;
      }
    | null
    | undefined;
  identity:
    | {
        usernameDisplay: string | null;
      }
    | null
    | undefined;
  isLoading: boolean;
};

const UNKNOWN_USER_LABEL = "Unknown user";

export default function GeneralTab({
  currentUser,
  identity,
  isLoading,
}: GeneralTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const displayName =
    identity?.usernameDisplay?.trim() ||
    currentUser?.name?.trim() ||
    currentUser?.email?.trim() ||
    UNKNOWN_USER_LABEL;

  const emailLabel = currentUser?.email ?? "Not connected";
  const fallbackSource = displayName.replace(/[^A-Za-z0-9]/g, "");
  const avatarFallback = fallbackSource
    .slice(0, 2)
    .toUpperCase()
    .padEnd(2, "?");

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-base font-semibold leading-tight">General</h3>
        <p className="text-sm text-muted-foreground">
          Overview of your account identity. Updates happen instantly wherever
          you sign in.
        </p>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={currentUser?.image ?? undefined} alt="" />
              <AvatarFallback className="text-base font-medium">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold leading-tight">
                {displayName}
              </CardTitle>
              <CardDescription className="text-sm">
                {emailLabel}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold leading-tight">
              Display name
            </h4>
            <p className="text-sm text-muted-foreground">
              {identity?.usernameDisplay ??
                "Set a username from the Profile tab."}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold leading-tight">
              Sign-in email
            </h4>
            <p className="text-sm text-muted-foreground">
              {currentUser?.email ?? "No email linked."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

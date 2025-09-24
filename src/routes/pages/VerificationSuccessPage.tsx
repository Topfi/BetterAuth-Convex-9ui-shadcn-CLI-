import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PublicPageShell } from "@/components/PublicPageShell";

const REDIRECT_DELAY_MS = 5000;

export default function VerificationSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      navigate("/workspace", { replace: true });
    }, REDIRECT_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <PublicPageShell contentClassName="py-6 sm:py-10">
      <div className="mx-auto flex h-full w-full max-w-md items-center justify-center">
        <Card className="w-full border shadow-sm">
          <CardHeader className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              You&apos;re all set
            </h1>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div
              role="status"
              aria-live="polite"
              aria-label="Redirecting to your workspace"
              className="rounded-md border border-dashed p-4"
            >
              <p className="text-sm text-foreground">
                Thanks for verifying your email. We&apos;re opening your
                workspace now.
              </p>
            </div>
            <p className="text-sm">
              This page will redirect automatically, but you can jump in right
              away if you&apos;d like.
            </p>
            <Link
              to="/workspace"
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Go to workspace
            </Link>
          </CardContent>
        </Card>
      </div>
    </PublicPageShell>
  );
}

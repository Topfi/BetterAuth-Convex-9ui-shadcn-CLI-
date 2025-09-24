import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PublicPageShell } from "@/components/PublicPageShell";

export default function PendingVerificationPage() {
  return (
    <PublicPageShell contentClassName="py-6 sm:py-10">
      <div className="mx-auto flex h-full w-full max-w-md items-center justify-center">
        <Card className="w-full border shadow-sm">
          <CardHeader className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Confirm your email
            </h1>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div
              role="status"
              aria-live="polite"
              aria-label="Verification pending"
              className="rounded-md border border-dashed p-4"
            >
              <p className="text-sm text-foreground">
                We&apos;ve sent you a verification email. Once it&apos;s
                confirmed we will activate your workspace access.
              </p>
            </div>
            <p className="text-sm">
              We saved your details for 24 hours. Finish verification from the
              email at any time during that window to keep your username.
            </p>
            <p className="text-sm">
              Didn&apos;t get the email? Check your spam folder or request a new
              link from the sign in screen.
            </p>
            <Link
              to="/sign-in"
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary underline-offset-4 transition hover:underline"
            >
              Return to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </PublicPageShell>
  );
}

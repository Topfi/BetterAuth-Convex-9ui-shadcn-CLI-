import { Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PublicPageShell } from "@/components/PublicPageShell";

export default function PrivacyPage() {
  return (
    <PublicPageShell
      className="bg-background text-foreground"
      contentClassName="py-10"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <section aria-labelledby="privacy-heading" className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Lock className="size-5" aria-hidden />
                <span className="text-sm font-medium uppercase tracking-wide">
                  Privacy
                </span>
              </div>
              <CardTitle
                id="privacy-heading"
                className="text-3xl font-semibold tracking-tight"
              >
                Privacy Policy
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Replace this section with your team&apos;s information. Document
                how you collect, store, and protect data across the workspace,
                including passphrase handling and audit logging practices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Use this placeholder area to outline data retention timelines,
                third-party processors, and your approach to encryption at rest
                and in transit.
              </p>
              <p>
                Call out how users can request data exports or deletion, and
                reiterate that the account deletion flow removes all user-owned
                persistence according to your Convex purger entries.
              </p>
              <p className="rounded-lg bg-muted p-4">
                <strong className="font-medium text-foreground">
                  Action required:
                </strong>{" "}
                Replace this section with your team&apos;s privacy policy before
                sharing with customers.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </PublicPageShell>
  );
}

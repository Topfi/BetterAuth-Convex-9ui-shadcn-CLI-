import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PublicPageShell } from "@/components/PublicPageShell";

export default function TermsPage() {
  return (
    <PublicPageShell
      className="bg-background text-foreground"
      contentClassName="py-10"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <section aria-labelledby="terms-heading" className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <ShieldCheck className="size-5" aria-hidden />
                <span className="text-sm font-medium uppercase tracking-wide">
                  Legal
                </span>
              </div>
              <CardTitle
                id="terms-heading"
                className="text-3xl font-semibold tracking-tight"
              >
                Terms of Service
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Replace this section with your team&apos;s information. These
                terms should describe how your workspace operates and what
                customers can expect when they join.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                This placeholder copy keeps our styling contract intact. Swap it
                with your definitive terms once legal has finalized them so
                everyone knows the boundaries of your workspace.
              </p>
              <p>
                Be sure to include acceptable use guidelines, payment
                obligations, termination policies, and any other passphrase or
                credential-related requirements relevant to your product.
              </p>
              <p className="rounded-lg bg-muted p-4">
                <strong className="font-medium text-foreground">
                  Action required:
                </strong>{" "}
                Replace this section with your team&apos;s legal terms before
                launch.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </PublicPageShell>
  );
}

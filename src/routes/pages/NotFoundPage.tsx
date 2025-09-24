import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PublicPageShell } from "@/components/PublicPageShell";

export default function NotFoundPage() {
  return (
    <PublicPageShell contentClassName="py-6 sm:py-10">
      <div className="mx-auto flex h-full w-full max-w-xl items-center justify-center">
        <Card className="w-full border shadow-sm">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Page not found
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              We couldn&apos;t locate that workspace page. Double-check the URL
              or head back to safety.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border bg-muted p-4 text-muted-foreground">
              <SearchX className="size-5" aria-hidden />
              <p className="text-sm">
                The page you&apos;re looking for may have been moved or no
                longer exists.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link to="/">Return home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PublicPageShell>
  );
}

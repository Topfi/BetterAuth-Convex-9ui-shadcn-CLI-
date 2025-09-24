import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RootError() {
  const error = useRouteError();
  const isResponseError = isRouteErrorResponse(error);

  const status = isResponseError ? error.status : null;
  const statusText = isResponseError ? error.statusText : null;

  let detail: string | null = null;
  if (isResponseError) {
    if (typeof error.data === "string") {
      detail = error.data;
    } else if (
      error.data &&
      typeof error.data === "object" &&
      "message" in error.data &&
      typeof (error.data as { message?: unknown }).message === "string"
    ) {
      detail = (error.data as { message: string }).message;
    }
  } else if (error instanceof Error) {
    detail = error.message;
  }

  const heading = status ? `Error ${status}` : "Something went wrong";
  const description = statusText
    ? `${statusText}. Try reloading the page.`
    : "We hit a snag while loading this page. Try reloading or head back home.";

  return (
    <div className="min-h-dvh bg-muted/15 px-4 py-6 sm:py-10">
      <div className="mx-auto flex h-full w-full max-w-xl items-center justify-center">
        <Card className="w-full border shadow-sm">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              {heading}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              <AlertTriangle className="mt-0.5 size-5" aria-hidden />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {statusText ?? "Unexpected error"}
                </p>
                {detail ? (
                  <p className="text-sm text-destructive/80">{detail}</p>
                ) : null}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              If this keeps happening, reload the page or return to the
              workspace.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.reload();
              }}
            >
              Try again
            </Button>
            <Button asChild>
              <Link to="/">Return home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

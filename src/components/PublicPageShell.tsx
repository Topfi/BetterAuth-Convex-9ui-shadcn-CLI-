import { type PropsWithChildren, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type PublicPageShellProps = PropsWithChildren<{
  className?: string;
  contentClassName?: string;
  brand?: ReactNode;
  homeHref?: string;
  homeLabel?: string;
}>;

export function PublicPageShell({
  brand,
  children,
  className,
  contentClassName,
  homeHref = "/",
  homeLabel = "Better Auth",
}: PublicPageShellProps) {
  const resolvedBrand = brand ?? (
    <Link
      to={homeHref}
      className="text-sm font-semibold leading-none tracking-tight text-foreground transition-colors hover:text-primary"
      aria-label={`Go to the ${homeLabel} home page`}
    >
      {homeLabel}
    </Link>
  );

  return (
    <div className={cn("min-h-dvh bg-muted/15", className)}>
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {resolvedBrand}
          <ThemeToggle />
        </div>
      </header>
      <main
        className={cn(
          "mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-6 lg:px-8",
          contentClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus } from "lucide-react";

export default function Counter() {
  const { isAuthenticated } = useConvexAuth();
  const value = useQuery(api.counter.get, {}) ?? 0;

  const increment = useMutation(api.counter.increment).withOptimisticUpdate(
    (store, args) => {
      const current = store.getQuery(api.counter.get, {});
      if (current !== undefined) {
        store.setQuery(api.counter.get, {}, current + args.increment);
      }
    },
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold leading-tight">
          Counter
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          <Button
            aria-label="Decrement"
            variant="outline"
            size="icon"
            className="size-12"
            onClick={() => increment({ increment: -1 })}
          >
            <Minus className="size-5" aria-hidden />
          </Button>

          <Separator orientation="vertical" className="hidden sm:block h-12" />

          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Current value
            </div>
            <div
              className="font-semibold text-4xl sm:text-5xl tracking-tight"
              aria-live="polite"
            >
              {value}
            </div>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-12" />

          <Button
            aria-label="Increment"
            size="icon"
            className="size-12"
            onClick={() => increment({ increment: +1 })}
          >
            <Plus className="size-5" aria-hidden />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { forwardRef, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PassphraseInputProps = React.ComponentPropsWithoutRef<typeof Input>;

export const PassphraseInput = forwardRef<
  HTMLInputElement,
  PassphraseInputProps
>(function PassphraseInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const reveal = () => {
    setVisible(true);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      timeoutRef.current = null;
    }, 5000);
  };

  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={reveal}
        aria-label={
          visible ? "Extend passphrase visibility" : "Show passphrase"
        }
        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
});

import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useMutation } from "convex/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { api } from "../../../convex/_generated/api";
import {
  pickIdentityPreviewSample,
  usernameDisplaySchema,
} from "../../../shared/identity";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import {
  PREFERRED_USERNAME_STORAGE_KEY,
  USERNAME_TAKEN_ERROR,
  AUTOCLAIM_FAILURE_MESSAGE,
} from "@/features/identity";

const formSchema = z.object({
  username: usernameDisplaySchema,
});

type FormValues = z.infer<typeof formSchema>;

type OnboardingState = {
  notice?: "conflict";
};

type AutoclaimErrorState =
  | { reason: "no_email"; message?: string }
  | { reason: "conflict"; message?: string }
  | { reason: "error"; message?: string }
  | null;

export default function ClaimUsernamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as OnboardingState | null) ?? null;
  const autoclaim = useMutation(api.identity.autoclaimUsernameFromSession);
  const updateUsername = useMutation(api.identity.updateUsername);
  const [autoclaimError, setAutoclaimError] =
    useState<AutoclaimErrorState>(null);
  const [isAutoclaiming, setIsAutoclaiming] = useState(true);
  const [identitySample] = useState(() => pickIdentityPreviewSample());
  const [storedUsername] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window.localStorage.getItem(PREFERRED_USERNAME_STORAGE_KEY) ?? "";
  });

  const clearStoredUsername = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PREFERRED_USERNAME_STORAGE_KEY);
      }
    } catch {
      // ignore persistence errors
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: storedUsername },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await autoclaim({});
        if (!active) {
          return;
        }
        if (result?.ok) {
          clearStoredUsername();
          navigate("/workspace", { replace: true });
          return;
        }
        if (!result) {
          setAutoclaimError({
            reason: "error",
            message: AUTOCLAIM_FAILURE_MESSAGE,
          });
          return;
        }
        if (result.reason === "not_authenticated") {
          navigate("/sign-in", { replace: true });
          return;
        }
        setAutoclaimError({ reason: result.reason, message: result.message });
      } catch {
        if (!active) {
          return;
        }
        setAutoclaimError({
          reason: "error",
          message: AUTOCLAIM_FAILURE_MESSAGE,
        });
      } finally {
        if (active) {
          setIsAutoclaiming(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [autoclaim, clearStoredUsername, navigate]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateUsername({ display: values.username });
      clearStoredUsername();
      navigate("/workspace", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      if (message === USERNAME_TAKEN_ERROR) {
        form.setError("username", {
          type: "server",
          message,
        });
        form.setFocus("username");
        return;
      }
      form.setError("username", {
        type: "server",
        message: "Could not save username. Try again.",
      });
    }
  });

  if (isAutoclaiming && !autoclaimError) {
    return (
      <div className="min-h-dvh bg-background text-foreground flex flex-col transition-colors">
        <main className="flex-1 w-full">
          <div className="max-w-md mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
            <Card>
              <CardHeader>
                <CardTitle>Setting up your workspace…</CardTitle>
                <CardDescription>Claiming a username for you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-1/2" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const showConflictNotice =
    locationState?.notice === "conflict" ||
    autoclaimError?.reason === "conflict";
  const showNoEmailNotice = autoclaimError?.reason === "no_email";
  const supportingMessage = showNoEmailNotice
    ? "We couldn’t read your email to suggest a username. Please choose one."
    : showConflictNotice
      ? USERNAME_TAKEN_ERROR
      : autoclaimError?.reason === "error"
        ? (autoclaimError.message ?? AUTOCLAIM_FAILURE_MESSAGE)
        : null;

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col transition-colors">
      <main className="flex-1 w-full">
        <div className="max-w-md mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Choose a username</CardTitle>
              <CardDescription>
                Usernames must use 3–32 letters or digits. Capitalization is
                just for show.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supportingMessage ? (
                <p className="mb-4 text-sm text-muted-foreground" role="status">
                  {supportingMessage}
                </p>
              ) : null}
              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-4" noValidate>
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={`e.g. ${identitySample.username}`}
                            autoComplete="off"
                            autoCapitalize="none"
                            aria-describedby="username-help"
                          />
                        </FormControl>
                        <p
                          id="username-help"
                          className="text-xs text-muted-foreground"
                        >
                          Letters and digits only, no spaces or punctuation.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    Save username
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

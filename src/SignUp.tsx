import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/form";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { SessionFallback } from "@/routes/guards";
import { SignUpSchema, type SignUpValues } from "../shared/auth-schemas";
import { pickIdentityPreviewSample } from "../shared/identity";
import {
  PREFERRED_USERNAME_STORAGE_KEY,
  USERNAME_TAKEN_ERROR,
} from "@/features/identity";
import { api } from "../convex/_generated/api";
import { PublicPageShell } from "@/components/PublicPageShell";
import { PassphraseInput } from "@/components/PassphraseInput";
import {
  copyPassphraseToClipboard,
  generatePassphrase,
} from "@/lib/passphrase";
import { convertImageToBase64 } from "@/lib/image";
import { resolveVerificationSuccessUrl } from "@/lib/verification";
import {
  assertAcceptablePassphrase,
  COMPROMISED_PASSPHRASE_MESSAGE,
  evaluatePassphraseStrength,
  getPassphraseStrengthLabel,
  PassphraseValidationError,
} from "@/shared/passphrase-strength";
import { cn } from "@/lib/utils";

export default function SignUp() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const stagePendingIdentity = useMutation(api.identity.stagePendingIdentity);
  const [identitySample] = useState(() => pickIdentityPreviewSample());
  const form = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      image: null,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const usernameValue = form.watch("username");
  const emailValue = form.watch("email");
  const passphraseValue = form.watch("password");
  const profileInitials =
    usernameValue.trim().slice(0, 2).toUpperCase() || "PR";

  const passphraseEvaluation = evaluatePassphraseStrength({
    passphrase: passphraseValue,
    metadata: [emailValue, usernameValue],
  });
  const passphraseStrengthLabel = getPassphraseStrengthLabel(
    passphraseEvaluation.score,
  );
  const strengthBarClass = cn(
    "h-1 rounded-full transition-all",
    passphraseEvaluation.score >= 4
      ? "bg-emerald-500"
      : passphraseEvaluation.score >= 2
        ? "bg-amber-500"
        : "bg-destructive",
  );
  const strengthPercentage = Math.max(
    0,
    Math.min(100, (passphraseEvaluation.score / 4) * 100),
  );
  const config = useQuery(api.config.publicConfig);
  const passphraseSignUpEnabled = config?.passphraseSignUp === true;
  const featureConfigReady = config !== undefined;

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (isAuthenticated) {
      navigate("/workspace", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const submitSignUp = form.handleSubmit(async (values) => {
    if (!passphraseSignUpEnabled) {
      return;
    }
    form.clearErrors();

    try {
      assertAcceptablePassphrase({
        passphrase: values.password,
        metadata: [values.email, values.username],
      });
    } catch (error) {
      if (error instanceof PassphraseValidationError) {
        form.setError("password", {
          type: "validation",
          message: error.message,
        });
        toast.error(error.message);
        return;
      }
      throw error;
    }

    const imageBase64 = values.image
      ? await convertImageToBase64(values.image)
      : undefined;

    const verificationSuccessUrl = resolveVerificationSuccessUrl();

    const { data, error } = await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.username,
        image: imageBase64,
        callbackURL: verificationSuccessUrl,
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          setLoading(false);
        },
        onError: () => {
          setLoading(false);
        },
      },
    );

    if (error) {
      const message =
        typeof error.message === "string"
          ? error.message
          : "We couldn't create your profile. Try again.";

      if (message === COMPROMISED_PASSPHRASE_MESSAGE) {
        form.setError("password", {
          type: "server",
          message,
        });
      } else {
        form.setError("email", {
          type: "server",
          message,
        });
      }

      setLoading(false);
      toast.error(message);
      return;
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          PREFERRED_USERNAME_STORAGE_KEY,
          values.username,
        );
      }
    } catch {
      // Ignore storage failures (private mode, etc.).
    }

    if (!data?.user?.id) {
      toast.error("We couldn't finish creating your profile. Try again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await stagePendingIdentity({
        betterAuthUserId: data.user.id,
        email: values.email,
        username: values.username,
        imageBase64,
      });
      toast.info("Check your email to verify your account within 24 hours.");
      navigate("/auth/pending-verification", { replace: true });
    } catch (stageError) {
      const message =
        stageError instanceof Error ? stageError.message : undefined;
      if (message === USERNAME_TAKEN_ERROR) {
        form.setError("username", {
          type: "server",
          message,
        });
      } else {
        const fallback = "Could not save username. Try again.";
        toast.error(message ?? fallback);
        form.setError("username", {
          type: "server",
          message: fallback,
        });
      }
    } finally {
      setLoading(false);
    }
  });

  if (isLoading) {
    return <SessionFallback />;
  }

  return (
    <PublicPageShell contentClassName="py-6 sm:py-10">
      <div className="mx-auto flex h-full w-full max-w-2xl items-center justify-center">
        <Card className="w-full border shadow-sm">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Create your account
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              We&apos;ll keep your profile in sync with Better Auth. Uploading a
              profile image is optional.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!featureConfigReady ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading sign-up options…
              </div>
            ) : passphraseSignUpEnabled ? (
              <Form {...form}>
                <form className="grid gap-6" noValidate onSubmit={submitSignUp}>
                  {/* Username + Email in one aligned row; username helper on its own line below */}
                  <div className="grid gap-4 sm:grid-cols-2 items-start">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field, fieldState }) => (
                        <FormItem className="space-y-2">
                          <FormLabel htmlFor="username">Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              id="username"
                              placeholder={`e.g. ${identitySample.username}`}
                              autoComplete="off"
                              autoCapitalize="none"
                              aria-describedby="username-help"
                              aria-invalid={
                                fieldState.invalid ? "true" : undefined
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <FormItem className="space-y-2">
                          <FormLabel htmlFor="email">Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              id="email"
                              type="email"
                              placeholder={`e.g. ${identitySample.email}`}
                              required
                              autoComplete="email"
                              aria-invalid={
                                fieldState.invalid ? "true" : undefined
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Username helper line lives below username input without affecting email column */}
                    <div className="sm:col-span-1">
                      <p
                        id="username-help"
                        className="text-xs text-muted-foreground"
                      >
                        Letters and digits only, 3–32 characters.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field, fieldState }) => (
                        <FormItem className="space-y-2">
                          <div className="flex items-center justify-between">
                            <FormLabel htmlFor="password">Passphrase</FormLabel>
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto px-0 py-0 text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
                              onClick={async () => {
                                try {
                                  const generated = generatePassphrase(24);
                                  form.setValue("password", generated, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                  form.setValue(
                                    "passwordConfirmation",
                                    generated,
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    },
                                  );
                                  await copyPassphraseToClipboard(generated);
                                  toast.info(
                                    "Generated passphrase copied to your clipboard.",
                                  );
                                } catch {
                                  // Silent failure per requirements.
                                }
                              }}
                            >
                              Generate
                            </Button>
                          </div>
                          <FormControl>
                            <PassphraseInput
                              {...field}
                              id="password"
                              placeholder="Passphrase"
                              autoComplete="new-password"
                              required
                              aria-invalid={
                                fieldState.invalid ? "true" : undefined
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="passwordConfirmation"
                      render={({ field, fieldState }) => (
                        <FormItem className="space-y-2">
                          <FormLabel htmlFor="password-confirmation">
                            Confirm passphrase
                          </FormLabel>
                          <FormControl>
                            <PassphraseInput
                              {...field}
                              id="password-confirmation"
                              placeholder="Confirm passphrase"
                              autoComplete="new-password"
                              required
                              aria-invalid={
                                fieldState.invalid ? "true" : undefined
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="sm:col-span-2 space-y-2">
                      <div className="text-xs text-muted-foreground">
                        At least 8 characters; we block weak or breached
                        passphrases automatically.
                      </div>
                      <div
                        role="status"
                        aria-live="polite"
                        className="-mx-6 px-6"
                        data-strength-score={passphraseEvaluation.score}
                      >
                        <div className="h-1 w-full rounded-full bg-muted">
                          <div
                            aria-hidden="true"
                            className={strengthBarClass}
                            style={{ width: `${strengthPercentage}%` }}
                          />
                        </div>
                        <span className="sr-only">
                          Passphrase strength: {passphraseStrengthLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-3">
                        <FormLabel htmlFor="image">
                          Profile image (optional)
                        </FormLabel>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <Avatar className="size-20 border">
                            {imagePreview ? (
                              <AvatarImage
                                src={imagePreview}
                                alt="Profile preview"
                              />
                            ) : (
                              <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                                {profileInitials}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex flex-col gap-3 sm:flex-1">
                            <FormControl>
                              <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                aria-describedby="image-helper"
                                onBlur={field.onBlur}
                                ref={field.ref}
                                aria-invalid={
                                  fieldState.invalid ? "true" : undefined
                                }
                                onChange={(event) => {
                                  const file = event.target.files?.[0] ?? null;
                                  field.onChange(file);
                                  if (
                                    file &&
                                    ["image/png", "image/jpeg"].includes(
                                      file.type,
                                    )
                                  ) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setImagePreview(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  } else {
                                    setImagePreview(null);
                                  }
                                  event.target.value = "";
                                  void form.trigger("image");
                                }}
                              />
                            </FormControl>
                            <FormDescription
                              id="image-helper"
                              className="text-xs text-muted-foreground"
                            >
                              PNG or JPEG up to 5 MB.
                            </FormDescription>
                          </div>
                          {imagePreview ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Remove selected profile image"
                              onClick={() => {
                                field.onChange(null);
                                setImagePreview(null);
                                void form.trigger("image");
                              }}
                            >
                              <X className="size-4" aria-hidden />
                            </Button>
                          ) : null}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2
                        className="mr-2 size-4 animate-spin"
                        aria-hidden
                      />
                    ) : null}
                    Create account
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Sign up is currently disabled.
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                className="px-0"
                render={<Link to="/sign-in" />}
              >
                Sign in
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </PublicPageShell>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConvexAuth, useQuery } from "convex/react";
import { Apple, Github, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import { authClient } from "@/lib/auth-client";
import { api } from "../convex/_generated/api";
import { toast } from "@/lib/toast";
import { SessionFallback } from "@/routes/guards";
import { SignInSchema, type SignInValues } from "../shared/auth-schemas";
import { pickIdentityPreviewSample } from "../shared/identity";
import { PublicPageShell } from "@/components/PublicPageShell";
import { PassphraseInput } from "@/components/PassphraseInput";
import { resolveVerificationSuccessUrl } from "@/lib/verification";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const EMPTY_SOCIAL_ERRORS: readonly string[] = [];
const PENDING_VERIFICATION_MESSAGE =
  "Verify your email to continue. We saved your details for 24 hours.";

export default function SignIn() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [identitySample] = useState(() => pickIdentityPreviewSample());
  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });
  const [otp, setOtp] = useState("");
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [signInMethod, setSignInMethod] = useState<"password" | "passwordless">(
    "passwordless",
  );
  const [otpSent, setOtpSent] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const navigate = useNavigate();
  const verificationSuccessUrl = resolveVerificationSuccessUrl();

  const config = useQuery(api.config.publicConfig);
  const isConfigReady = config !== undefined;
  const passphraseSignInEnabled = config?.passphraseSignIn === true;
  const passphraseSignUpEnabled = config?.passphraseSignUp === true;
  const magicLinkSignInEnabled = config?.magicLinkSignIn === true;
  const verificationCodeSignInEnabled = config?.verificationCodeSignIn === true;
  const passwordlessEnabled =
    magicLinkSignInEnabled || verificationCodeSignInEnabled;
  const emailSignInEnabled = passphraseSignInEnabled || passwordlessEnabled;
  const githubEnabled = config?.githubOAuth ?? false;
  const githubErrors = config?.githubErrors ?? EMPTY_SOCIAL_ERRORS;
  const hasGithubErrors = githubEnabled && githubErrors.length > 0;
  const googleEnabled = config?.googleOAuth ?? false;
  const googleErrors = config?.googleErrors ?? EMPTY_SOCIAL_ERRORS;
  const hasGoogleErrors = googleEnabled && googleErrors.length > 0;
  const appleEnabled = config?.appleOAuth ?? false;
  const appleErrors = config?.appleErrors ?? EMPTY_SOCIAL_ERRORS;
  const hasAppleErrors = appleEnabled && appleErrors.length > 0;
  const hasAnySocial = githubEnabled || googleEnabled || appleEnabled;
  const shownGithubErrorsRef = useRef<Set<string>>(new Set());
  const shownGoogleErrorsRef = useRef<Set<string>>(new Set());
  const shownAppleErrorsRef = useRef<Set<string>>(new Set());
  const emailValue = form.watch("email");

  useEffect(() => {
    if (!passphraseSignInEnabled && signInMethod === "password") {
      setSignInMethod(passwordlessEnabled ? "passwordless" : "password");
    } else if (!passwordlessEnabled && signInMethod === "passwordless") {
      setSignInMethod(passphraseSignInEnabled ? "password" : "passwordless");
    }
  }, [passphraseSignInEnabled, passwordlessEnabled, signInMethod]);

  useEffect(() => {
    if (!verificationCodeSignInEnabled) {
      setOtp("");
      setOtpSent(false);
    }
  }, [verificationCodeSignInEnabled]);

  useEffect(() => {
    const shown = shownGithubErrorsRef.current;
    if (!githubEnabled || githubErrors.length === 0) {
      shown.clear();
      return;
    }

    for (const error of githubErrors) {
      if (shown.has(error)) continue;
      shown.add(error);
      toast.error(error);
    }
  }, [githubEnabled, githubErrors]);

  useEffect(() => {
    const shown = shownGoogleErrorsRef.current;
    if (!googleEnabled || googleErrors.length === 0) {
      shown.clear();
      return;
    }

    for (const error of googleErrors) {
      if (shown.has(error)) continue;
      shown.add(error);
      toast.error(error);
    }
  }, [googleEnabled, googleErrors]);

  useEffect(() => {
    const shown = shownAppleErrorsRef.current;
    if (!appleEnabled || appleErrors.length === 0) {
      shown.clear();
      return;
    }

    for (const error of appleErrors) {
      if (shown.has(error)) continue;
      shown.add(error);
      toast.error(error);
    }
  }, [appleEnabled, appleErrors]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (isAuthenticated) {
      navigate("/workspace", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const githubButtonDisabled = githubLoading || hasGithubErrors;
  const githubButtonLabel = hasGithubErrors
    ? `GitHub sign-in unavailable: ${githubErrors.join(", ")}`
    : "Sign in with GitHub";
  const githubButtonTitle = hasGithubErrors ? githubButtonLabel : undefined;
  const googleButtonDisabled = googleLoading || hasGoogleErrors;
  const googleButtonLabel = hasGoogleErrors
    ? `Google sign-in unavailable: ${googleErrors.join(", ")}`
    : "Sign in with Google";
  const googleButtonTitle = hasGoogleErrors ? googleButtonLabel : undefined;
  const appleButtonDisabled = appleLoading || hasAppleErrors;
  const appleButtonLabel = hasAppleErrors
    ? `Apple sign-in unavailable: ${appleErrors.join(", ")}`
    : "Sign in with Apple";
  const appleButtonTitle = hasAppleErrors ? appleButtonLabel : undefined;
  const passwordlessButtonCount =
    (magicLinkSignInEnabled ? 1 : 0) + (verificationCodeSignInEnabled ? 1 : 0);
  const passwordlessGridClass = cn(
    "grid gap-3",
    passwordlessButtonCount > 1 ? "sm:grid-cols-2" : undefined,
  );
  const canToggleMethod = passphraseSignInEnabled && passwordlessEnabled;
  const passwordlessToggleLabel =
    passwordlessButtonCount > 1
      ? "Use a magic link or verification code instead"
      : magicLinkSignInEnabled
        ? "Use a magic link instead"
        : "Use a verification code instead";

  const submitPassphrase = form.handleSubmit(async (values) => {
    if (!passphraseSignInEnabled) {
      return;
    }
    form.clearErrors();
    let handledUnverified = false;
    const { error: signInError } = await authClient.signIn.email(values, {
      onRequest: () => {
        setOtpLoading(true);
      },
      onSuccess: () => {
        setOtpLoading(false);
      },
      onError: (ctx) => {
        setOtpLoading(false);
        const message = ctx.error.message;
        if (message.toLowerCase().includes("not verified")) {
          handledUnverified = true;
          toast.info(PENDING_VERIFICATION_MESSAGE);
          navigate("/auth/pending-verification", { replace: true });
          return;
        }
        form.setError("password", {
          type: "server",
          message,
        });
        toast.error(message);
      },
    });

    if (
      !handledUnverified &&
      signInError?.message?.toLowerCase().includes("not verified")
    ) {
      toast.info(PENDING_VERIFICATION_MESSAGE);
      navigate("/auth/pending-verification", { replace: true });
    }
  });

  const handleResetPassword = async () => {
    const isEmailValid = await form.trigger("email");
    if (!isEmailValid) {
      form.setFocus("email");
      return;
    }
    const email = form.getValues("email").trim();
    setForgotLoading(true);
    try {
      const resetPasswordUrl = new URL(
        "/reset-password",
        import.meta.env.VITE_SITE_URL ?? window.location.origin,
      ).toString();
      await authClient.forgetPassword({
        email,
        redirectTo: resetPasswordUrl,
      });
      toast.success("Check your email for the reset passphrase link!");
    } catch {
      toast.error("Failed to send reset passphrase link. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleMagicLinkSignIn = async () => {
    if (!magicLinkSignInEnabled) {
      return;
    }
    const isEmailValid = await form.trigger("email");
    if (!isEmailValid) {
      form.setFocus("email");
      return;
    }
    const email = form.getValues("email").trim();
    await authClient.signIn.magicLink(
      {
        email,
        callbackURL: verificationSuccessUrl,
      },
      {
        onRequest: () => {
          setMagicLinkLoading(true);
        },
        onSuccess: () => {
          setMagicLinkLoading(false);
          toast.success("Check your email for the magic link!");
        },
        onError: (ctx) => {
          setMagicLinkLoading(false);
          toast.error(ctx.error.message);
        },
      },
    );
  };

  const handleGithubSignIn = async () => {
    if (!githubEnabled || hasGithubErrors || githubLoading) {
      return;
    }

    try {
      setGithubLoading(true);
      const { signInWithGitHub } = await import("./lib/github-auth");
      await signInWithGitHub();
    } catch {
      // signInWithGitHub reports errors via toast; swallow to keep UI responsive.
    } finally {
      setGithubLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleEnabled || hasGoogleErrors || googleLoading) {
      return;
    }

    setGoogleLoading(true);
    let handledError = false;
    try {
      await authClient.signIn.social(
        {
          provider: "google",
        },
        {
          onError: (ctx) => {
            handledError = true;
            toast.error(ctx.error.message);
          },
        },
      );
    } catch (error) {
      if (!handledError) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to sign in with Google.";
        toast.error(message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!appleEnabled || hasAppleErrors || appleLoading) {
      return;
    }

    setAppleLoading(true);
    let handledError = false;
    try {
      await authClient.signIn.social(
        {
          provider: "apple",
        },
        {
          onError: (ctx) => {
            handledError = true;
            toast.error(ctx.error.message);
          },
        },
      );
    } catch (error) {
      if (!handledError) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to sign in with Apple.";
        toast.error(message);
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const handleOtpSignIn = async () => {
    if (!verificationCodeSignInEnabled) {
      return;
    }
    const isEmailValid = await form.trigger("email");
    if (!isEmailValid) {
      form.setFocus("email");
      return;
    }
    const email = form.getValues("email").trim();
    if (!otpSent) {
      await authClient.emailOtp.sendVerificationOtp(
        {
          email,
          type: "sign-in",
          callbackURL: verificationSuccessUrl,
        },
        {
          onRequest: () => {
            setOtpLoading(true);
          },
          onSuccess: () => {
            setOtpLoading(false);
            setOtpSent(true);
          },
          onError: (ctx) => {
            setOtpLoading(false);
            toast.error(ctx.error.message);
          },
        },
      );
    } else {
      await authClient.signIn.emailOtp(
        {
          email,
          otp,
          callbackURL: verificationSuccessUrl,
        },
        {
          onRequest: () => {
            setOtpLoading(true);
          },
          onSuccess: () => {
            setOtpLoading(false);
          },
          onError: (ctx) => {
            setOtpLoading(false);
            toast.error(ctx.error.message);
          },
        },
      );
    }
  };

  if (isLoading) {
    return <SessionFallback />;
  }

  return (
    <PublicPageShell contentClassName="py-6 sm:py-10">
      <div className="mx-auto flex h-full w-full max-w-md items-center justify-center">
        <Card className="w-full border shadow-sm">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Sign in with your email using the methods enabled for your
              workspace.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isConfigReady ? (
              emailSignInEnabled ? (
                <Form {...form}>
                  <form
                    className="space-y-6"
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (signInMethod === "password") {
                        void submitPassphrase();
                        return;
                      }
                      if (otpSent) {
                        void handleOtpSignIn();
                      }
                    }}
                  >
                    <div className="space-y-4">
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

                      {passphraseSignInEnabled &&
                      signInMethod === "password" ? (
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field, fieldState }) => (
                            <FormItem className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <FormLabel htmlFor="password">
                                  Passphrase
                                </FormLabel>
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  className="px-0"
                                  disabled={forgotLoading || !emailValue}
                                  onClick={() => {
                                    void handleResetPassword();
                                  }}
                                >
                                  {forgotLoading ? (
                                    <Loader2
                                      className="mr-1 size-3 animate-spin"
                                      aria-hidden
                                    />
                                  ) : null}
                                  Forgot?
                                </Button>
                              </div>
                              <FormControl>
                                <PassphraseInput
                                  {...field}
                                  id="password"
                                  placeholder="Passphrase"
                                  autoComplete="current-password"
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
                      ) : null}

                      {signInMethod === "passwordless" &&
                      otpSent &&
                      verificationCodeSignInEnabled ? (
                        <div className="space-y-2">
                          <Label htmlFor="otp">Verification code</Label>
                          <Input
                            id="otp"
                            type="text"
                            placeholder="Enter verification code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            required
                            value={otp}
                            onChange={(event) => {
                              setOtp(event.target.value);
                            }}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      {passphraseSignInEnabled &&
                      signInMethod === "password" ? (
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={otpLoading}
                        >
                          {otpLoading ? (
                            <Loader2
                              className="mr-2 size-4 animate-spin"
                              aria-hidden
                            />
                          ) : null}
                          Sign in with passphrase
                        </Button>
                      ) : null}

                      {signInMethod === "passwordless" &&
                      !otpSent &&
                      passwordlessEnabled ? (
                        <div className={passwordlessGridClass}>
                          {magicLinkSignInEnabled ? (
                            <Button
                              type="button"
                              className="w-full"
                              disabled={magicLinkLoading || otpLoading}
                              onClick={() => {
                                void handleMagicLinkSignIn();
                              }}
                            >
                              {magicLinkLoading ? (
                                <Loader2
                                  className="mr-2 size-4 animate-spin"
                                  aria-hidden
                                />
                              ) : null}
                              Send magic link
                            </Button>
                          ) : null}
                          {verificationCodeSignInEnabled ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              disabled={magicLinkLoading || otpLoading}
                              onClick={() => {
                                void handleOtpSignIn();
                              }}
                            >
                              {otpLoading ? (
                                <Loader2
                                  className="mr-2 size-4 animate-spin"
                                  aria-hidden
                                />
                              ) : null}
                              Send verification code
                            </Button>
                          ) : null}
                        </div>
                      ) : null}

                      {signInMethod === "passwordless" &&
                      otpSent &&
                      verificationCodeSignInEnabled ? (
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={otpLoading}
                        >
                          {otpLoading ? (
                            <Loader2
                              className="mr-2 size-4 animate-spin"
                              aria-hidden
                            />
                          ) : null}
                          Verify code
                        </Button>
                      ) : null}

                      {canToggleMethod ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            const nextMethod =
                              signInMethod === "password"
                                ? "passwordless"
                                : "password";
                            setSignInMethod(nextMethod);
                            form.resetField("password", { defaultValue: "" });
                            form.clearErrors("password");
                            setOtp("");
                            setOtpSent(false);
                          }}
                        >
                          {signInMethod === "password"
                            ? passwordlessToggleLabel
                            : "Use a passphrase instead"}
                        </Button>
                      ) : null}
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Email-based sign-in is currently disabled. Use the options
                  below or contact support for help.
                </div>
              )
            ) : (
              <EmailSignInSkeleton />
            )}

            {hasAnySocial ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Separator className="flex-1" />
                  <span className="uppercase tracking-wide">
                    or continue with
                  </span>
                  <Separator className="flex-1" />
                </div>
                {githubEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center gap-2"
                    disabled={githubButtonDisabled}
                    aria-label={githubButtonLabel}
                    aria-disabled={githubButtonDisabled ? "true" : undefined}
                    title={githubButtonTitle}
                    onClick={() => {
                      void handleGithubSignIn();
                    }}
                  >
                    {githubLoading ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Github className="size-4" aria-hidden />
                    )}
                    Sign in with GitHub
                  </Button>
                ) : null}
                {googleEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center gap-2"
                    disabled={googleButtonDisabled}
                    aria-label={googleButtonLabel}
                    aria-disabled={googleButtonDisabled ? "true" : undefined}
                    title={googleButtonTitle}
                    onClick={() => {
                      void handleGoogleSignIn();
                    }}
                  >
                    {googleLoading ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <svg
                        aria-hidden
                        xmlns="http://www.w3.org/2000/svg"
                        width="0.98em"
                        height="1em"
                        viewBox="0 0 256 262"
                      >
                        <path
                          fill="#4285F4"
                          d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                        />
                        <path
                          fill="#34A853"
                          d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                        />
                        <path
                          fill="#FBBC05"
                          d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                        />
                        <path
                          fill="#EB4335"
                          d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                        />
                      </svg>
                    )}
                    Sign in with Google
                  </Button>
                ) : null}
                {appleEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center gap-2"
                    disabled={appleButtonDisabled}
                    aria-label={appleButtonLabel}
                    aria-disabled={appleButtonDisabled ? "true" : undefined}
                    title={appleButtonTitle}
                    onClick={() => {
                      void handleAppleSignIn();
                    }}
                  >
                    {appleLoading ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Apple className="size-4" aria-hidden />
                    )}
                    Sign in with Apple
                  </Button>
                ) : null}
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-primary">
                terms
              </a>{" "}
              and acknowledge our{" "}
              <a href="/privacy" className="underline hover:text-primary">
                privacy policy
              </a>
              .
            </p>

            {passphraseSignUpEnabled ? (
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Button
                  variant="link"
                  className="px-0"
                  render={<Link to="/sign-up" />}
                >
                  Create one
                </Button>
              </p>
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </PublicPageShell>
  );
}

function EmailSignInSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
      data-testid="email-sign-in-loading"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

import { useEffect, useId, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PreviewCard, PreviewCardContent } from "@/components/ui/preview-card";
import { PassphraseInput } from "@/components/PassphraseInput";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import {
  copyPassphraseToClipboard,
  generatePassphrase,
} from "@/lib/passphrase";
import { cn } from "@/lib/utils";
import { api } from "@/convex/api";
import { MIN_PASSPHRASE_LENGTH, passphraseSchema } from "@/shared/auth-schemas";
import {
  assertAcceptablePassphrase,
  COMPROMISED_PASSPHRASE_MESSAGE,
  evaluatePassphraseStrength,
  getPassphraseStrengthLabel,
  PassphraseValidationError,
} from "@/shared/passphrase-strength";
import type { SecurityRisk } from "@/shared/settings/security";

const rotationSchema = z
  .object({
    passphrase: passphraseSchema,
    confirmPassphrase: passphraseSchema,
  })
  .superRefine((values, ctx) => {
    if (values.passphrase !== values.confirmPassphrase) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passphrases must match.",
        path: ["confirmPassphrase"],
      });
    }
  });

type RotationFormValues = z.infer<typeof rotationSchema>;

type TrafficLightTone = "success" | "warning" | "danger";

type IndicatorCopy = {
  tone: TrafficLightTone;
  title: string;
  description: string;
};

type TrafficLightStyles = {
  container: string;
  dot: string;
  badge: string;
};

const TRAFFIC_LIGHT_STYLES: Record<TrafficLightTone, TrafficLightStyles> = {
  success: {
    container: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    badge: "bg-emerald-600 text-white",
  },
  warning: {
    container: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    badge: "bg-amber-500 text-white",
  },
  danger: {
    container: "bg-destructive/10 border-destructive/20",
    dot: "bg-destructive",
    badge: "bg-destructive text-destructive-foreground",
  },
};

function determineIndicator(risks: SecurityRisk[]): IndicatorCopy {
  if (risks.some((risk) => risk.level === "high")) {
    return {
      tone: "danger",
      title: "Security status: High risk",
      description: "Resolve the critical items below to protect your account.",
    } satisfies IndicatorCopy;
  }

  if (risks.some((risk) => risk.level === "medium")) {
    return {
      tone: "warning",
      title: "Security status: Needs attention",
      description: "Tighten your defenses by addressing the highlighted items.",
    } satisfies IndicatorCopy;
  }

  return {
    tone: "success",
    title: "Security status: All clear",
    description: "Your account meets our baseline security recommendations.",
  } satisfies IndicatorCopy;
}

type SecurityTabProps = {
  accountEmail?: string | null;
  accountName?: string | null;
};

export default function SecurityTab({
  accountEmail,
  accountName,
}: SecurityTabProps = {}) {
  const overview = useQuery(api.settings_security.getOverview);
  const rotatePassphrase = useMutation(api.settings_security.rotatePassphrase);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<RotationFormValues>({
    resolver: zodResolver(rotationSchema),
    defaultValues: {
      passphrase: "",
      confirmPassphrase: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const passphraseValue = form.watch("passphrase");
  const passphraseEvaluation = evaluatePassphraseStrength({
    passphrase: passphraseValue,
    metadata: [accountEmail, accountName],
  });
  const passphraseStrengthLabel = getPassphraseStrengthLabel(
    passphraseEvaluation.score,
  );
  const shouldShowPassphraseStrength = passphraseValue.length > 0;

  const authDescriptionId = useId();
  const backupDescriptionId = useId();

  useEffect(() => {
    if (overview === undefined) {
      return;
    }
    form.reset({ passphrase: "", confirmPassphrase: "" });
  }, [overview, form]);

  if (overview === undefined) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-md bg-muted" aria-hidden />
        <div className="h-48 animate-pulse rounded-md bg-muted" aria-hidden />
      </div>
    );
  }

  const indicator = determineIndicator(overview.risks ?? []);
  const showPreviewCard = !overview.hasPassphrase;

  const handleGenerate = async () => {
    try {
      const generated = generatePassphrase();
      form.setValue("passphrase", generated, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      form.setValue("confirmPassphrase", generated, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      await copyPassphraseToClipboard(generated);
      toast.info("Generated passphrase copied to your clipboard.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not generate a passphrase.";
      toast.error(message);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      assertAcceptablePassphrase({
        passphrase: values.passphrase,
        metadata: [accountEmail, accountName],
      });

      await rotatePassphrase({ passphrase: values.passphrase });
      toast.success("Passphrase updated successfully.");
      form.reset({ passphrase: "", confirmPassphrase: "" });
    } catch (error) {
      if (error instanceof PassphraseValidationError) {
        form.setError("passphrase", {
          type: "validation",
          message: error.message,
        });
        toast.error(error.message);
        return;
      }

      const message = error instanceof Error ? error.message : null;
      if (message === COMPROMISED_PASSPHRASE_MESSAGE) {
        form.setError("passphrase", {
          type: "server",
          message,
        });
      }
      toast.error(message ?? "Could not rotate passphrase. Try again.");
    } finally {
      setIsSaving(false);
    }
  });

  const styles = TRAFFIC_LIGHT_STYLES[indicator.tone];

  return (
    <div className="space-y-6">
      <section
        role="status"
        aria-live="polite"
        aria-label="Account security status"
        data-traffic-light={indicator.tone}
        className={cn(
          "flex flex-col gap-3 rounded-md border p-4 shadow-sm transition-colors",
          styles.container,
        )}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn("h-2 w-2 rounded-full", styles.dot)}
          />
          <Badge className={styles.badge}>Status</Badge>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{indicator.title}</h3>
          <p className="text-sm text-muted-foreground">
            {indicator.description}
          </p>
        </div>
        {overview.risks.length > 0 ? (
          <div className="space-y-2">
            <Separator />
            <p className="text-sm font-medium">Resolve the following:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {overview.risks.map((risk) => (
                <li key={risk.id}>{risk.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {showPreviewCard ? (
        <PreviewCard open>
          <PreviewCardContent
            arrow={false}
            sideOffset={0}
            className="space-y-3 rounded-xl border bg-card p-6 text-card-foreground shadow-sm"
          >
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">
                No passphrase required—yet
              </h4>
              <p className="text-sm text-muted-foreground">
                You currently sign in with magic links and trusted providers.
                Add a passphrase when you need credentials outside those
                providers.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Enabling a passphrase unlocks two-factor authentication and backup
              codes, which will appear here as soon as setup is complete.
            </p>
          </PreviewCardContent>
        </PreviewCard>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Rotate your passphrase
            </CardTitle>
            <CardDescription>
              Generate a strong passphrase and store it in a secure manager.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-6">
            <Form {...form}>
              <form className="space-y-4" onSubmit={onSubmit} noValidate>
                <FormField
                  control={form.control}
                  name="passphrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="security-new-passphrase">
                        New passphrase
                      </FormLabel>
                      <FormControl>
                        <PassphraseInput
                          {...field}
                          id="security-new-passphrase"
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum {MIN_PASSPHRASE_LENGTH} characters; the
                        generator creates secure combinations for you.
                      </FormDescription>
                      {shouldShowPassphraseStrength ? (
                        <p
                          role="status"
                          aria-live="polite"
                          data-strength-score={passphraseEvaluation.score}
                          className={cn(
                            "text-sm",
                            passphraseEvaluation.acceptable
                              ? "text-muted-foreground"
                              : "text-yellow-700 dark:text-yellow-400",
                          )}
                        >
                          Passphrase strength: {passphraseStrengthLabel}
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassphrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="security-confirm-passphrase">
                        Confirm passphrase
                      </FormLabel>
                      <FormControl>
                        <PassphraseInput
                          {...field}
                          id="security-confirm-passphrase"
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void handleGenerate();
                    }}
                  >
                    Generate strong passphrase
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving…" : "Save new passphrase"}
                  </Button>
                </div>
              </form>
            </Form>

            <Separator />

            <section className="space-y-4">
              <header className="space-y-1">
                <h5 className="text-base font-semibold">
                  Two-factor authentication
                </h5>
                <p className="text-sm text-muted-foreground">
                  Two-factor support is coming soon. Preview the planned
                  controls below.
                </p>
              </header>

              <div className="space-y-3" aria-live="polite">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">Authenticator app</p>
                    <p
                      id={authDescriptionId}
                      className="text-sm text-muted-foreground"
                    >
                      Enable time-based one-time codes (TOTP) for sign-in.
                    </p>
                  </div>
                  <Switch
                    aria-label="Enable authenticator app"
                    aria-describedby={authDescriptionId}
                    disabled
                    checked={overview.twoFactorEnabled}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">Backup codes</p>
                    <p
                      id={backupDescriptionId}
                      className="text-sm text-muted-foreground"
                    >
                      Download single-use codes to recover access when offline.
                    </p>
                  </div>
                  <Switch
                    aria-label="Manage backup codes"
                    aria-describedby={backupDescriptionId}
                    disabled
                  />
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

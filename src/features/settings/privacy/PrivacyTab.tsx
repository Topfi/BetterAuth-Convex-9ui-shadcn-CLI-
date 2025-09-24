import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import { authClient } from "@/lib/auth-client";
import { api } from "@/convex/api";
import {
  ACCOUNT_EXPORT_DELIVERY_WINDOW_HOURS,
  accountDeletionConfirmationSchema,
} from "@/shared/settings/privacy";

type IdentityDetails =
  | {
      usernameDisplay: string | null;
      usernameLower: string | null;
    }
  | null
  | undefined;

type PrivacyTabProps = {
  identity: IdentityDetails;
};

type DeletionFormValues = {
  confirmation: string;
};

export default function PrivacyTab({ identity }: PrivacyTabProps) {
  const requestExport = useMutation(api.settings_privacy.requestExport);
  const purgeAccount = useMutation(api.settings_privacy.purgeAccount);
  const navigate = useNavigate();

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const requiredUsername = identity?.usernameDisplay?.trim() ?? "";
  const deletionForm = useForm<DeletionFormValues>({
    resolver: zodResolver(accountDeletionConfirmationSchema),
    defaultValues: { confirmation: "" },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    deletionForm.reset({ confirmation: "" });
  }, [requiredUsername, deletionForm]);

  const confirmationValue = deletionForm.watch("confirmation");
  const normalizedConfirmation = confirmationValue?.trim() ?? "";
  const matchesUsername =
    requiredUsername.length > 0 && normalizedConfirmation === requiredUsername;

  const isDeletionAvailable = requiredUsername.length > 0;
  const disableDeletionButton =
    !isDeletionAvailable || !matchesUsername || isDeleting;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await requestExport({});
      if (result.status === "scheduled") {
        toast.info(
          `We scheduled your export. Expect an email within ${ACCOUNT_EXPORT_DELIVERY_WINDOW_HOURS} hours.`,
        );
      } else {
        toast.info("We scheduled your export request.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : null;
      toast.error(message ?? "Could not request your export. Try again later.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = deletionForm.handleSubmit(async () => {
    if (!matchesUsername) {
      deletionForm.setError("confirmation", {
        type: "validate",
        message: `Type “${requiredUsername}” to confirm deletion.`,
      });
      return;
    }

    setIsDeleting(true);
    try {
      await purgeAccount({});
      // TODO: once audit logging is available, record this deletion event.
      await authClient.deleteUser();
      toast.error(
        "Your account has been deleted. You'll be redirected to sign in.",
      );
      navigate("/sign-in");
    } catch (error) {
      const message = error instanceof Error ? error.message : null;
      toast.error(message ?? "Could not delete your account. Try again later.");
    } finally {
      setIsDeleting(false);
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Account export
          </CardTitle>
          <CardDescription>
            We’ll prepare an export of your data and email a download link
            within {ACCOUNT_EXPORT_DELIVERY_WINDOW_HOURS} hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The download link stays active for 24 hours. You can request a new
            copy at any time, and we’ll notify you when the file is ready.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void handleExport();
            }}
            disabled={isExporting}
          >
            {isExporting ? "Scheduling export…" : "Request account export"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-destructive">
            Delete account
          </CardTitle>
          <CardDescription>
            This permanently removes your workspace data. There’s no undo and
            your username becomes available to others.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...deletionForm}>
            <form className="space-y-4" onSubmit={handleDelete} noValidate>
              <FormField
                control={deletionForm.control}
                name="confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="privacy-delete-confirmation">
                      {isDeletionAvailable
                        ? `Type “${requiredUsername}” to confirm`
                        : "Set a username before deleting your account"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="privacy-delete-confirmation"
                        autoComplete="off"
                        disabled={!isDeletionAvailable || isDeleting}
                      />
                    </FormControl>
                    <FormDescription>
                      {isDeletionAvailable
                        ? "We’ll sign you out and remove your profile immediately."
                        : "Create a username on the Profile tab to enable account deletion."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={disableDeletionButton}
                >
                  {isDeleting ? "Deleting…" : "Delete account"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

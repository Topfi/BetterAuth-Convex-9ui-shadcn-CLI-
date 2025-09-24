import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import { authClient } from "@/lib/auth-client";
import { convertImageToBase64 } from "@/lib/image";
import { api } from "../../../../convex/_generated/api";
import {
  emailUpdateSchema,
  profileImageUpdateSchema,
} from "../../../../shared/settings_profile";
import { profileImageSchema } from "../../../../shared/auth-schemas";
import {
  usernameDisplaySchema,
  USERNAME_TAKEN_ERROR,
} from "../../../../shared/identity";

export type ProfileTabProps = {
  currentUser:
    | {
        email: string | null;
        image: string | null;
        name?: string | null;
      }
    | null
    | undefined;
  identity:
    | {
        usernameDisplay: string | null;
        usernameLower: string | null;
      }
    | null
    | undefined;
};

type UsernameFormValues = z.infer<typeof usernameFormSchema>;
const usernameFormSchema = z.object({
  username: usernameDisplaySchema,
});

type EmailFormValues = z.infer<typeof emailUpdateSchema>;

const profileImageFormSchema = z.object({
  image: profileImageSchema,
});

type ProfileImageFormValues = z.infer<typeof profileImageFormSchema>;

type UsernameIdentity = NonNullable<ProfileTabProps["identity"]>;

export default function ProfileTab({ currentUser, identity }: ProfileTabProps) {
  const updateUsername = useMutation(api.identity.updateUsername);
  const requestEmailChange = useMutation(api.identity.requestEmailChange);
  const updateProfileImage = useMutation(api.identity.updateProfileImage);

  const initialUsername = identity?.usernameDisplay ?? "";
  const initialEmail = currentUser?.email ?? "";
  const source = identity?.usernameDisplay ?? currentUser?.email ?? "?";
  const inferredInitials = source.slice(0, 1).toUpperCase();

  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: { username: initialUsername },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailUpdateSchema),
    defaultValues: { email: initialEmail },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const imageForm = useForm<ProfileImageFormValues>({
    resolver: zodResolver(profileImageFormSchema),
    defaultValues: { image: undefined },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const [profilePreview, setProfilePreview] = useState<string | null>(
    currentUser?.image ?? null,
  );
  const [didClearImage, setDidClearImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEmailConfirmOpen, setEmailConfirmOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    usernameForm.reset({ username: identity?.usernameDisplay ?? "" });
  }, [identity?.usernameDisplay, usernameForm]);

  useEffect(() => {
    emailForm.reset({ email: currentUser?.email ?? "" });
  }, [currentUser?.email, emailForm]);

  useEffect(() => {
    setProfilePreview(currentUser?.image ?? null);
    setDidClearImage(false);
    setSelectedFile(null);
    imageForm.reset({ image: undefined });
  }, [currentUser?.image, imageForm]);

  const onSubmitUsername = usernameForm.handleSubmit(async (values) => {
    if (values.username === initialUsername) {
      toast.info("You're already using this username.");
      return;
    }
    try {
      await updateUsername({ display: values.username });
      toast.success("Username updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      if (message === USERNAME_TAKEN_ERROR) {
        usernameForm.setError("username", {
          type: "server",
          message,
        });
        return;
      }
      toast.error("Could not update username. Try again.");
    }
  });

  const onSubmitEmail = emailForm.handleSubmit((values) => {
    if (values.email === initialEmail) {
      toast.info("You're already using this email.");
      return;
    }
    setPendingEmail(values.email);
    setEmailConfirmOpen(true);
  });

  const onConfirmEmailChange = async () => {
    if (!pendingEmail) {
      return;
    }
    try {
      await requestEmailChange({ email: pendingEmail });
      toast.info(
        "Check your inbox to verify the new email before signing back in.",
      );
      await authClient.signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : null;
      emailForm.setError("email", {
        type: "server",
        message: message ?? "Could not request email change. Try again.",
      });
      toast.error(message ?? "Could not request email change. Try again.");
    } finally {
      setEmailConfirmOpen(false);
      setPendingEmail(null);
    }
  };

  const onSubmitImage = imageForm.handleSubmit(async (values) => {
    const file = values.image;

    if (!file && !didClearImage) {
      toast.info("Select a new image or remove the current one before saving.");
      return;
    }

    try {
      let imagePayload: string | null = null;
      if (file) {
        const base64 = await convertImageToBase64(file);
        profileImageUpdateSchema.parse({ image: base64 });
        imagePayload = base64;
      }

      if (didClearImage && !file) {
        profileImageUpdateSchema.parse({ image: null });
        await updateProfileImage({ image: null });
        toast.success("Profile image removed.");
        return;
      }

      if (!imagePayload) {
        return;
      }

      await updateProfileImage({ image: imagePayload });
      toast.success("Profile image updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : null;
      toast.error(message ?? "Could not update profile image. Try again.");
    } finally {
      imageForm.reset({ image: undefined });
      setDidClearImage(false);
      setSelectedFile(null);
    }
  });

  if (currentUser === undefined || identity === undefined) {
    return null;
  }

  const usernameDisplay = (identity as UsernameIdentity)?.usernameDisplay ?? "";
  const email = currentUser?.email ?? "";

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold leading-tight">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Update your username, email, and avatar.
          </p>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar
              className="size-16 border"
              role="img"
              aria-label={usernameDisplay || email}
            >
              {profilePreview ? (
                <AvatarImage
                  src={profilePreview}
                  alt={usernameDisplay || email}
                />
              ) : (
                <AvatarFallback aria-hidden>{inferredInitials}</AvatarFallback>
              )}
            </Avatar>
          </div>
          <Separator />

          <Form {...usernameForm}>
            <form
              data-testid="username-form"
              className="space-y-4"
              onSubmit={onSubmitUsername}
              noValidate
            >
              <FormField
                control={usernameForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoCapitalize="none"
                        autoComplete="off"
                        aria-describedby="username-helper"
                      />
                    </FormControl>
                    <FormDescription id="username-helper">
                      Letters and digits only.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={usernameForm.formState.isSubmitting}
              >
                Save username
              </Button>
            </form>
          </Form>

          <Separator />

          <Form {...emailForm}>
            <form
              data-testid="email-form"
              className="space-y-4"
              onSubmit={onSubmitEmail}
              noValidate
            >
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" autoComplete="email" />
                    </FormControl>
                    <FormDescription>
                      We’ll email you a verification link and sign you out.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={emailForm.formState.isSubmitting}>
                Request email update
              </Button>
              <AlertDialog
                open={isEmailConfirmOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    setEmailConfirmOpen(false);
                    setPendingEmail(null);
                  }
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm email change</AlertDialogTitle>
                    <AlertDialogDescription>
                      You need to verify the new email before signing back in.
                      We’ll sign you out after this change.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEmailConfirmOpen(false);
                        setPendingEmail(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={onConfirmEmailChange}>
                      Confirm email change
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </form>
          </Form>

          <Separator />

          <Form {...imageForm}>
            <form
              data-testid="image-form"
              className="space-y-4"
              onSubmit={onSubmitImage}
              noValidate
            >
              <FormField
                control={imageForm.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile image</FormLabel>
                    <div className="flex items-start gap-3">
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (!file) {
                              return;
                            }
                            field.onChange(file);
                            setDidClearImage(false);
                            const isAllowedType =
                              file.type === "image/png" ||
                              file.type === "image/jpeg";
                            if (!isAllowedType) {
                              setSelectedFile(null);
                              void imageForm.trigger("image");
                              return;
                            }
                            setSelectedFile(file);
                            try {
                              const base64 = await convertImageToBase64(file);
                              setProfilePreview(base64);
                            } catch (err) {
                              console.error("Failed to preview image", err);
                              toast.error(
                                "Could not preview image. Try again.",
                              );
                            }
                          }}
                        />
                      </FormControl>
                      {profilePreview ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="self-center"
                          onClick={() => {
                            field.onChange(null);
                            setProfilePreview(null);
                            setDidClearImage(true);
                            setSelectedFile(null);
                          }}
                        >
                          Remove image
                        </Button>
                      ) : null}
                    </div>
                    <FormDescription>PNG or JPEG up to 5 MB.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={imageForm.formState.isSubmitting}
                >
                  Save image
                </Button>
                {selectedFile ? (
                  <span className="text-xs text-muted-foreground" role="status">
                    {selectedFile.name}
                  </span>
                ) : null}
              </div>
            </form>
          </Form>
        </div>
      </section>
    </div>
  );
}

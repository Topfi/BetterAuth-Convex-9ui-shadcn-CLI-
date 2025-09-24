import { z } from "zod";
import { usernameDisplaySchema } from "./identity";

export const MIN_PASSPHRASE_LENGTH = 8;
export const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_MIME_TYPES = ["image/png", "image/jpeg"] as const;

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Enter a valid email address." });

export const passphraseSchema = z.string().min(MIN_PASSPHRASE_LENGTH, {
  message: `Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`,
});

export const profileImageSchema = z
  .instanceof(File)
  .refine(
    (file) =>
      PROFILE_IMAGE_MIME_TYPES.includes(
        file.type as (typeof PROFILE_IMAGE_MIME_TYPES)[number],
      ),
    {
      message: "Profile image must be a PNG or JPEG.",
    },
  )
  .refine((file) => file.size <= MAX_PROFILE_IMAGE_SIZE_BYTES, {
    message: "Profile image must be 5 MB or less.",
  })
  .nullable()
  .optional();

export const SignInSchema = z.object({
  email: emailSchema,
  password: passphraseSchema,
});

export type SignInValues = z.infer<typeof SignInSchema>;

export const SignUpSchema = z
  .object({
    username: usernameDisplaySchema,
    email: emailSchema,
    password: passphraseSchema,
    passwordConfirmation: passphraseSchema,
    image: profileImageSchema,
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.passwordConfirmation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passphrases must match before continuing.",
        path: ["passwordConfirmation"],
      });
    }
  });

export type SignUpValues = z.infer<typeof SignUpSchema>;

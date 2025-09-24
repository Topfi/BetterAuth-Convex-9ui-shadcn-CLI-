import { z } from "zod";

import { MAX_PROFILE_IMAGE_SIZE_BYTES } from "../auth-schemas";
import { emailSchema } from "../identity";

const PROFILE_IMAGE_BASE64_REGEX =
  /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/;

export const emailUpdateSchema = z.object({
  email: emailSchema,
});

const base64SizeValidator = (value: string) => {
  const [, base64Payload = ""] = value.split(",", 2);
  if (!base64Payload) {
    return true;
  }
  const sizeInBytes = Math.ceil((base64Payload.length * 3) / 4);
  return sizeInBytes <= MAX_PROFILE_IMAGE_SIZE_BYTES;
};

export const profileImageDataUrlSchema = z
  .string()
  .trim()
  .regex(PROFILE_IMAGE_BASE64_REGEX, {
    message: "Profile image must be a PNG or JPEG.",
  })
  .refine(base64SizeValidator, {
    message: "Profile image must be 5 MB or less.",
  });

export const profileImageUpdateSchema = z.object({
  image: profileImageDataUrlSchema.nullable(),
});

export type ProfileImageUpdateInput = z.infer<typeof profileImageUpdateSchema>;

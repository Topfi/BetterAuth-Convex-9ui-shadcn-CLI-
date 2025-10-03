import { z } from "zod";

export const sendMessageSchema = z.object({
  appletId: z.string(),
  prompt: z.string().min(1, "Message cannot be empty"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;


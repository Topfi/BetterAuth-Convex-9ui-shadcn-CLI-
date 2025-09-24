import { toast } from "@/lib/toast";

export async function signInWithGitHub(): Promise<void> {
  let handledError = false;
  try {
    const { authClient } = await import("./auth-client");

    await authClient.signIn.social(
      { provider: "github" },
      {
        onError: (context) => {
          handledError = true;
          toast.error(context.error.message);
        },
      },
    );
  } catch (error) {
    if (!handledError) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in with GitHub.";
      toast.error(message);
    }
    throw error;
  }
}

import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { magicLinkClient, emailOTPClient } from "better-auth/client/plugins";

import { handleRateLimitResponse } from "./auth-client-rate-limit";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
  fetchOptions: {
    async onResponse(context) {
      if (context?.response) {
        await handleRateLimitResponse(context.response);
      }
    },
    async onError(context) {
      if (context?.response) {
        await handleRateLimitResponse(context.response);
      }
    },
  },
  plugins: [
    magicLinkClient(),
    emailOTPClient(),
    crossDomainClient(),
    convexClient(),
  ],
});

import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import { query } from "./_generated/server";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import {
  betterAuth,
  type HookEndpointContext,
  type BetterAuthPlugin,
} from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { emailOTP, haveIBeenPwned, magicLink } from "better-auth/plugins";
import { DataModel } from "./_generated/dataModel";
import {
  sendEmailVerification,
  sendMagicLink,
  sendOTPVerification,
  sendResetPassword,
} from "./email";
import { requireEnv } from "./util";
import {
  readAppleConfigFromEnv,
  readGithubConfigFromEnv,
  readGoogleConfigFromEnv,
} from "../shared/config";
import {
  sensitiveRateLimitPaths,
  securityLogPayloadSchema,
  type SecurityEvent,
  type SecurityLogPayload,
} from "../shared/security";
import { COMPROMISED_PASSPHRASE_MESSAGE } from "../shared/passphrase-strength";
import { createConvexRateLimitStorage } from "./rateLimitStorage";

const siteUrl = requireEnv("SITE_URL");
const env = process.env as Record<string, string | undefined>;
const githubConfig = readGithubConfigFromEnv(env);
const googleConfig = readGoogleConfigFromEnv(env);
const appleConfig = readAppleConfigFromEnv(env);

if (githubConfig.enabled && githubConfig.errors.length > 0) {
  console.error(
    `[auth] GitHub OAuth misconfiguration: ${githubConfig.errors.join(", ")}`,
  );
}

if (googleConfig.enabled && googleConfig.errors.length > 0) {
  console.error(
    `[auth] Google OAuth misconfiguration: ${googleConfig.errors.join(", ")}`,
  );
}

if (appleConfig.enabled && appleConfig.errors.length > 0) {
  console.error(
    `[auth] Apple Sign In misconfiguration: ${appleConfig.errors.join(", ")}`,
  );
}

const IP_ADDRESS_HEADERS = [
  "x-forwarded-for",
  "cf-connecting-ip",
  "true-client-ip",
  "x-real-ip",
  "fly-client-ip",
] as const;

const RATE_LIMIT_PRESET_SHORT = { window: 10, max: 3 } as const;
const RATE_LIMIT_PRESET_MEDIUM = { window: 60, max: 5 } as const;
const RATE_LIMIT_PRESET_CRITICAL = { window: 300, max: 1 } as const;

type MutationCapableCtx = ActionCtx | MutationCtx;

type QueryCapableCtx = QueryCtx | MutationCtx | ActionCtx;

type SchedulerCapableCtx = ActionCtx | MutationCtx;

const hasRunMutation = (
  candidate: GenericCtx<DataModel>,
): candidate is MutationCapableCtx =>
  "runMutation" in candidate &&
  typeof (candidate as MutationCapableCtx).runMutation === "function";

const hasRunQuery = (
  candidate: GenericCtx<DataModel>,
): candidate is QueryCapableCtx =>
  "runQuery" in candidate &&
  typeof (candidate as QueryCapableCtx).runQuery === "function";

const hasScheduler = (
  candidate: GenericCtx<DataModel>,
): candidate is SchedulerCapableCtx =>
  "scheduler" in candidate &&
  typeof (candidate as SchedulerCapableCtx).scheduler.runAfter === "function";

type AuthOptions = Parameters<typeof betterAuth>[0];
type SocialProviders = NonNullable<AuthOptions["socialProviders"]>;

const socialProviders = {
  ...(githubConfig.enabled &&
  githubConfig.errors.length === 0 &&
  githubConfig.clientId &&
  githubConfig.clientSecret
    ? {
        github: {
          clientId: githubConfig.clientId,
          clientSecret: githubConfig.clientSecret,
        },
      }
    : {}),
  ...(googleConfig.enabled &&
  googleConfig.errors.length === 0 &&
  googleConfig.clientId &&
  googleConfig.clientSecret
    ? {
        google: {
          clientId: googleConfig.clientId,
          clientSecret: googleConfig.clientSecret,
        },
      }
    : {}),
  ...(appleConfig.enabled &&
  appleConfig.errors.length === 0 &&
  appleConfig.clientId &&
  appleConfig.clientSecret
    ? {
        apple: {
          clientId: appleConfig.clientId,
          clientSecret: appleConfig.clientSecret,
          ...(appleConfig.appBundleIdentifier
            ? { appBundleIdentifier: appleConfig.appBundleIdentifier }
            : {}),
        },
      }
    : {}),
} satisfies SocialProviders;

const hasSocialProviders = Object.keys(socialProviders).length > 0;

const trustedOrigins = new Set([siteUrl]);
if (appleConfig.enabled) {
  trustedOrigins.add("https://appleid.apple.com");
}

export const authComponent = createClient<DataModel>(components.betterAuth);

type AdapterWhereClause = {
  field: string;
  operator: string;
  value: string;
};

export type AdapterUserRecord = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  password?: string | null;
  twoFactorEnabled?: boolean | null;
} & Record<string, unknown>;

type AdapterUserOperations = {
  findOne: (args: {
    model: "user";
    where: AdapterWhereClause[];
  }) => Promise<AdapterUserRecord | null>;
  update: (args: {
    model: "user";
    where: AdapterWhereClause[];
    update: Record<string, unknown>;
  }) => Promise<void>;
};

const adapterSupportsUserOperations = (
  adapter: ReturnType<typeof authComponent.adapter>,
): adapter is ReturnType<typeof authComponent.adapter> &
  AdapterUserOperations => {
  const candidate = adapter as Partial<AdapterUserOperations>;
  return (
    typeof candidate.findOne === "function" &&
    typeof candidate.update === "function"
  );
};

export const getAdapterWithUserOperations = (ctx: GenericCtx<DataModel>) => {
  const adapter = authComponent.adapter(ctx);
  if (!adapterSupportsUserOperations(adapter)) {
    throw new Error("Better Auth adapter missing user operations");
  }
  return adapter;
};

let identityCleanupCronsEnsured = false;
let identityCleanupCronsEnsuring: Promise<void> | null = null;

const isPromise = (value: unknown): value is Promise<unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in (value as { then?: unknown }) &&
    typeof (value as { then?: unknown }).then === "function"
  );
};

const ensureIdentityCleanupCrons = async (
  ctx: GenericCtx<DataModel>,
): Promise<void> => {
  if (identityCleanupCronsEnsured) {
    return;
  }

  if (identityCleanupCronsEnsuring) {
    await identityCleanupCronsEnsuring;
    return;
  }

  const runMutation = hasRunMutation(ctx) ? ctx.runMutation : undefined;
  const runAfter = hasScheduler(ctx) ? ctx.scheduler.runAfter : undefined;

  if (typeof runMutation !== "function" && typeof runAfter !== "function") {
    return;
  }

  const ensurePromise = (async () => {
    try {
      if (typeof runMutation === "function") {
        await runMutation(
          internal.identity.ensurePendingIdentityCleanupCron,
          {},
        );
        await runMutation(internal.identity.ensureUsernameHoldCleanupCron, {});
      } else if (typeof runAfter === "function") {
        const pending = runAfter(
          0,
          internal.identity.ensurePendingIdentityCleanupCron,
          {},
        );
        const holds = runAfter(
          0,
          internal.identity.ensureUsernameHoldCleanupCron,
          {},
        );
        const maybePromises = [pending, holds].filter(isPromise);
        if (maybePromises.length > 0) {
          await Promise.all(maybePromises);
        }
      }
      identityCleanupCronsEnsured = true;
    } catch (error) {
      console.error(`[auth] Failed to ensure identity cleanup crons:`, error);
    }
  })();

  identityCleanupCronsEnsuring = ensurePromise;
  try {
    await ensurePromise;
  } finally {
    identityCleanupCronsEnsuring = null;
  }
};

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false },
) => {
  type FinalizeArgs = {
    betterAuthUserId: string;
    email: string;
    name?: string;
    imageUrl?: string;
  };

  const runFinalizeMutation = async (payload: FinalizeArgs) => {
    if (optionsOnly) {
      return;
    }

    try {
      if (hasScheduler(ctx)) {
        await ctx.scheduler.runAfter(
          0,
          internal.identity.finalizePendingIdentity,
          payload,
        );
      } else if (hasRunMutation(ctx)) {
        await ctx.runMutation(
          internal.identity.finalizePendingIdentity,
          payload,
        );
      }
    } catch (error) {
      console.error(
        `[auth] Failed to finalize pending identity for ${payload.betterAuthUserId}:`,
        error,
      );
    }
  };

  const finalizeIdentity = async (user: {
    id: string;
    email: string | null;
    name?: string | null;
    image?: string | null;
  }) => {
    if (!user.email) {
      return;
    }

    await runFinalizeMutation({
      betterAuthUserId: user.id,
      email: user.email,
      name: user.name ?? undefined,
      imageUrl: user.image ?? undefined,
    });
  };

  const finalizePaths = [
    "/sign-in",
    "/sign-up",
    "/magic-link",
    "/email-otp",
    "/otp",
    "/oauth2",
    "/callback",
  ];

  const finalizeSessionMiddleware = createAuthMiddleware(async (hookCtx) => {
    const session = hookCtx.context.newSession ?? hookCtx.context.session;
    const user = session?.user;
    if (!user) {
      return;
    }

    await finalizeIdentity({
      id: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
      image: user.image ?? null,
    });
  });

  const finalizePlugin: BetterAuthPlugin = {
    id: "finalize_pending_identity",
    hooks: {
      after: [
        {
          matcher: (hookCtx: HookEndpointContext) => {
            const path = hookCtx.path ?? "";
            return finalizePaths.some((prefix) => path.startsWith(prefix));
          },
          handler: finalizeSessionMiddleware,
        },
      ],
    },
  };

  const extractHeaderValue = (headers: unknown, key: string) => {
    if (!headers) {
      return undefined;
    }

    if (headers instanceof Headers) {
      const value = headers.get(key);
      return value ?? undefined;
    }

    if (typeof headers === "object") {
      const value = (headers as Record<string, string | string[] | undefined>)[
        key
      ];
      if (Array.isArray(value)) {
        return value[0];
      }
      return value ?? undefined;
    }

    return undefined;
  };

  const extractIpAddress = (headers: unknown) => {
    for (const header of IP_ADDRESS_HEADERS) {
      const value = extractHeaderValue(headers, header);
      if (typeof value === "string" && value.length > 0) {
        const [ip] = value.split(",");
        if (ip) {
          return ip.trim();
        }
      }
    }
    return undefined;
  };

  const scheduleSecurityEvent = (payload: SecurityLogPayload) => {
    if (optionsOnly) {
      return;
    }

    const normalized: SecurityLogPayload = {
      ...payload,
      details: payload.details
        ? Object.fromEntries(
            Object.entries(payload.details).map(([key, value]) => [key, value]),
          )
        : undefined,
    };

    try {
      if (hasScheduler(ctx)) {
        void ctx.scheduler.runAfter(
          0,
          internal.auditLogs.recordSecurityEvent,
          normalized,
        );
        return;
      }

      if (hasRunMutation(ctx)) {
        void ctx.runMutation(
          internal.auditLogs.recordSecurityEvent,
          normalized,
        );
      }
    } catch (error) {
      console.error(`[auth] Failed to record security event:`, error);
    }
  };

  const emitSecurityEvent = (
    hookCtx: HookEndpointContext,
    event: SecurityEvent,
    message: string,
    level: SecurityLogPayload["level"],
    details?: Record<string, string>,
  ) => {
    const session =
      hookCtx.context.newSession ?? hookCtx.context.session ?? undefined;
    const actorSubject = session?.user?.id;
    const ipAddress = extractIpAddress(hookCtx.headers);
    const requestId = (hookCtx.context as { requestId?: string }).requestId;

    scheduleSecurityEvent({
      event,
      message,
      path: hookCtx.path ?? "/",
      actorSubject,
      ipAddress,
      details,
      requestId,
      level,
    });
  };

  const readReturnedStatus = (hookCtx: HookEndpointContext) => {
    const returned = (hookCtx.context as { returned?: unknown }).returned;
    if (returned instanceof Response) {
      return returned.status;
    }
    return undefined;
  };

  const auditPlugin: BetterAuthPlugin = {
    id: "convex_audit_logger",
    hooks: {
      after: [
        {
          matcher: (hookCtx) => hookCtx.path?.startsWith("/sign-in") ?? false,
          handler: createAuthMiddleware(async (hookCtx) => {
            const status = readReturnedStatus(hookCtx);
            if (status === 429) {
              emitSecurityEvent(
                hookCtx,
                "sign_in_rate_limited",
                "Sign-in attempt rate limited",
                "warn",
                { status: String(status) },
              );
              return;
            }

            if (!status || (status >= 200 && status < 400)) {
              emitSecurityEvent(
                hookCtx,
                "sign_in_success",
                "Sign-in succeeded",
                "info",
                status ? { status: String(status) } : undefined,
              );
            }
          }),
        },
        {
          matcher: (hookCtx) => hookCtx.path === "/sign-up/email",
          handler: createAuthMiddleware(async (hookCtx) => {
            const status = readReturnedStatus(hookCtx);
            if (!status || (status >= 200 && status < 400)) {
              emitSecurityEvent(
                hookCtx,
                "sign_up_success",
                "Sign-up completed",
                "info",
                status ? { status: String(status) } : undefined,
              );
            }
          }),
        },
        {
          matcher: (hookCtx) =>
            hookCtx.path === "/forget-password" ||
            hookCtx.path === "/reset-password",
          handler: createAuthMiddleware(async (hookCtx) => {
            emitSecurityEvent(
              hookCtx,
              "passphrase_reset_requested",
              "Passphrase reset requested",
              "warn",
            );
          }),
        },
        {
          matcher: (hookCtx) =>
            hookCtx.path?.startsWith("/two-factor/") ?? false,
          handler: createAuthMiddleware(async (hookCtx) => {
            emitSecurityEvent(
              hookCtx,
              "two_factor_challenge",
              "Two-factor challenge invoked",
              "info",
              { endpoint: hookCtx.path ?? "/two-factor" },
            );
          }),
        },
        {
          matcher: (hookCtx) => hookCtx.path === "/delete-user",
          handler: createAuthMiddleware(async (hookCtx) => {
            emitSecurityEvent(
              hookCtx,
              "account_deleted",
              "Account deletion initiated",
              "warn",
            );
          }),
        },
      ],
    },
  };

  const rateLimitRules = sensitiveRateLimitPaths.reduce(
    (acc, path) => {
      if (path === "/sign-in/email" || path === "/sign-up/email") {
        acc[path] = { ...RATE_LIMIT_PRESET_SHORT };
      } else if (path === "/delete-user") {
        acc[path] = { ...RATE_LIMIT_PRESET_CRITICAL };
      } else {
        acc[path] = { ...RATE_LIMIT_PRESET_MEDIUM };
      }
      return acc;
    },
    {} as Record<string, { window: number; max: number }>,
  );

  const shouldEnableRateLimit =
    env.BETTER_AUTH_RATE_LIMIT_ENABLED === "true" ||
    (env.BETTER_AUTH_RATE_LIMIT_ENABLED !== "false" &&
      env.NODE_ENV === "production");

  const ctxRunQuery = hasRunQuery(ctx) ? ctx.runQuery : undefined;
  const ctxRunMutation = hasRunMutation(ctx) ? ctx.runMutation : undefined;

  type SecondaryStorageConfig = {
    get?: (
      key: string,
    ) => Promise<string | undefined | null> | string | undefined | null;
    set?: (key: string, value: string) => Promise<void> | void;
  };

  const secondaryStorage = (
    ctx as { options?: { secondaryStorage?: SecondaryStorageConfig } }
  ).options?.secondaryStorage;

  const rateLimitStorage =
    shouldEnableRateLimit && ctxRunQuery && ctxRunMutation
      ? createConvexRateLimitStorage({
          runQuery: ctxRunQuery,
          runMutation: ctxRunMutation,
          options: secondaryStorage ? { secondaryStorage } : undefined,
        })
      : undefined;

  if (!optionsOnly) {
    void ensureIdentityCleanupCrons(ctx);
  }

  return betterAuth({
    trustedOrigins: Array.from(trustedOrigins),
    logger: {
      level: "info",
      disabled: optionsOnly,
      log: (level, message, ...args) => {
        if (message === "security_event" && args[0]) {
          const candidate = {
            ...(args[0] as Record<string, unknown>),
            level,
          };
          const parsed = securityLogPayloadSchema.safeParse(candidate);
          if (parsed.success) {
            scheduleSecurityEvent(parsed.data);
            return;
          }
        }

        if (optionsOnly) {
          return;
        }

        const consoleMethod =
          level === "error"
            ? console.error
            : level === "warn"
              ? console.warn
              : level === "debug"
                ? console.debug
                : console.info;
        consoleMethod(`[auth] ${message}`, ...args);
      },
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: [...IP_ADDRESS_HEADERS],
      },
    },
    rateLimit: {
      enabled: shouldEnableRateLimit && Boolean(rateLimitStorage),
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": RATE_LIMIT_PRESET_SHORT,
        ...Object.fromEntries(
          Object.entries(rateLimitRules).filter(
            ([path]) => path !== "/sign-in/email",
          ),
        ),
      },
      ...(rateLimitStorage ? { customStorage: rateLimitStorage } : {}),
    },
    database: authComponent.adapter(ctx),
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmailVerification(ctx, {
          to: user.email,
          url,
        });
      },
      autoSignInAfterVerification: true,
      afterEmailVerification: async (user) => {
        await finalizeIdentity({
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? null,
          image: user.image ?? null,
        });
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendResetPassword(ctx, {
          to: user.email,
          url,
        });
      },
    },
    socialProviders: hasSocialProviders ? socialProviders : undefined,
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLink(ctx, {
            to: email,
            url,
          });
        },
      }),
      emailOTP({
        async sendVerificationOTP({ email, otp }) {
          await sendOTPVerification(ctx, {
            to: email,
            code: otp,
          });
        },
      }),
      haveIBeenPwned({
        customPasswordCompromisedMessage: COMPROMISED_PASSPHRASE_MESSAGE,
      }),
      crossDomain({ siteUrl }),
      convex(),
      auditPlugin,
      finalizePlugin,
    ],
    account: {
      accountLinking: {
        enabled: true,
      },
    },
  });
};

// Below are example helpers and functions for getting the current user
// Feel free to edit, omit, etc.
export const safeGetUser = async (ctx: QueryCtx) => {
  return authComponent.safeGetAuthUser(ctx);
};

export const getUserId = async (ctx: QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject;
};

export const getUser = async (ctx: QueryCtx) => {
  return authComponent.getAuthUser(ctx);
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return safeGetUser(ctx);
  },
});

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appletSync from "../appletSync.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as config from "../config.js";
import type * as counter from "../counter.js";
import type * as email from "../email.js";
import type * as emails_components_BaseEmail from "../emails/components/BaseEmail.js";
import type * as emails_components_baseEmailStyles from "../emails/components/baseEmailStyles.js";
import type * as emails_magicLink from "../emails/magicLink.js";
import type * as emails_resetPassword from "../emails/resetPassword.js";
import type * as emails_verifyEmail from "../emails/verifyEmail.js";
import type * as emails_verifyOTP from "../emails/verifyOTP.js";
import type * as generator from "../generator.js";
import type * as hash from "../hash.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as rateLimitStorage from "../rateLimitStorage.js";
import type * as settings_localization from "../settings_localization.js";
import type * as settings_privacy from "../settings_privacy.js";
import type * as settings_security from "../settings_security.js";
import type * as settings_theme from "../settings_theme.js";
import type * as util from "../util.js";
import type * as workspace from "../workspace.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  appletSync: typeof appletSync;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  config: typeof config;
  counter: typeof counter;
  email: typeof email;
  "emails/components/BaseEmail": typeof emails_components_BaseEmail;
  "emails/components/baseEmailStyles": typeof emails_components_baseEmailStyles;
  "emails/magicLink": typeof emails_magicLink;
  "emails/resetPassword": typeof emails_resetPassword;
  "emails/verifyEmail": typeof emails_verifyEmail;
  "emails/verifyOTP": typeof emails_verifyOTP;
  generator: typeof generator;
  hash: typeof hash;
  http: typeof http;
  identity: typeof identity;
  rateLimitStorage: typeof rateLimitStorage;
  settings_localization: typeof settings_localization;
  settings_privacy: typeof settings_privacy;
  settings_security: typeof settings_security;
  settings_theme: typeof settings_theme;
  util: typeof util;
  workspace: typeof workspace;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: {
    adapter: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                data: {
                  createdAt: number;
                  displayUsername?: null | string;
                  email: string;
                  emailVerified: boolean;
                  image?: null | string;
                  isAnonymous?: null | boolean;
                  name: string;
                  phoneNumber?: null | string;
                  phoneNumberVerified?: null | boolean;
                  twoFactorEnabled?: null | boolean;
                  updatedAt: number;
                  userId?: null | string;
                  username?: null | string;
                };
                model: "user";
              }
            | {
                data: {
                  createdAt: number;
                  expiresAt: number;
                  ipAddress?: null | string;
                  token: string;
                  updatedAt: number;
                  userAgent?: null | string;
                  userId: string;
                };
                model: "session";
              }
            | {
                data: {
                  accessToken?: null | string;
                  accessTokenExpiresAt?: null | number;
                  accountId: string;
                  createdAt: number;
                  idToken?: null | string;
                  password?: null | string;
                  providerId: string;
                  refreshToken?: null | string;
                  refreshTokenExpiresAt?: null | number;
                  scope?: null | string;
                  updatedAt: number;
                  userId: string;
                };
                model: "account";
              }
            | {
                data: {
                  createdAt: number;
                  expiresAt: number;
                  identifier: string;
                  updatedAt: number;
                  value: string;
                };
                model: "verification";
              }
            | {
                data: { backupCodes: string; secret: string; userId: string };
                model: "twoFactor";
              }
            | {
                data: {
                  aaguid?: null | string;
                  backedUp: boolean;
                  counter: number;
                  createdAt?: null | number;
                  credentialID: string;
                  deviceType: string;
                  name?: null | string;
                  publicKey: string;
                  transports?: null | string;
                  userId: string;
                };
                model: "passkey";
              }
            | {
                data: {
                  clientId?: null | string;
                  clientSecret?: null | string;
                  createdAt?: null | number;
                  disabled?: null | boolean;
                  icon?: null | string;
                  metadata?: null | string;
                  name?: null | string;
                  redirectURLs?: null | string;
                  type?: null | string;
                  updatedAt?: null | number;
                  userId?: null | string;
                };
                model: "oauthApplication";
              }
            | {
                data: {
                  accessToken?: null | string;
                  accessTokenExpiresAt?: null | number;
                  clientId?: null | string;
                  createdAt?: null | number;
                  refreshToken?: null | string;
                  refreshTokenExpiresAt?: null | number;
                  scopes?: null | string;
                  updatedAt?: null | number;
                  userId?: null | string;
                };
                model: "oauthAccessToken";
              }
            | {
                data: {
                  clientId?: null | string;
                  consentGiven?: null | boolean;
                  createdAt?: null | number;
                  scopes?: null | string;
                  updatedAt?: null | number;
                  userId?: null | string;
                };
                model: "oauthConsent";
              }
            | {
                data: {
                  createdAt: number;
                  name: string;
                  organizationId: string;
                  updatedAt?: null | number;
                };
                model: "team";
              }
            | {
                data: {
                  createdAt?: null | number;
                  teamId: string;
                  userId: string;
                };
                model: "teamMember";
              }
            | {
                data: {
                  createdAt: number;
                  logo?: null | string;
                  metadata?: null | string;
                  name: string;
                  slug?: null | string;
                };
                model: "organization";
              }
            | {
                data: {
                  createdAt: number;
                  organizationId: string;
                  role: string;
                  userId: string;
                };
                model: "member";
              }
            | {
                data: {
                  email: string;
                  expiresAt: number;
                  inviterId: string;
                  organizationId: string;
                  role?: null | string;
                  status: string;
                  teamId?: null | string;
                };
                model: "invitation";
              }
            | {
                data: {
                  domain: string;
                  issuer: string;
                  oidcConfig?: null | string;
                  organizationId?: null | string;
                  providerId: string;
                  samlConfig?: null | string;
                  userId?: null | string;
                };
                model: "ssoProvider";
              }
            | {
                data: {
                  createdAt: number;
                  privateKey: string;
                  publicKey: string;
                };
                model: "jwks";
              }
            | {
                data: {
                  cancelAtPeriodEnd?: null | boolean;
                  periodEnd?: null | number;
                  periodStart?: null | number;
                  plan: string;
                  referenceId: string;
                  seats?: null | number;
                  status?: null | string;
                  stripeCustomerId?: null | string;
                  stripeSubscriptionId?: null | string;
                  trialEnd?: null | number;
                  trialStart?: null | number;
                };
                model: "subscription";
              }
            | {
                data: {
                  address: string;
                  chainId: number;
                  createdAt: number;
                  isPrimary?: null | boolean;
                  userId: string;
                };
                model: "walletAddress";
              }
            | {
                data: {
                  count?: null | number;
                  key?: null | string;
                  lastRequest?: null | number;
                };
                model: "rateLimit";
              }
            | {
                data: { count: number; key: string; lastRequest: number };
                model: "ratelimit";
              };
          onCreateHandle?: string;
          select?: Array<string>;
        },
        any
      >;
      deleteMany: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "twoFactorEnabled"
                    | "isAnonymous"
                    | "username"
                    | "displayUsername"
                    | "phoneNumber"
                    | "phoneNumberVerified"
                    | "userId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "session";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "account";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "verification";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "twoFactor";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "secret" | "backupCodes" | "userId" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "passkey";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "publicKey"
                    | "userId"
                    | "credentialID"
                    | "counter"
                    | "deviceType"
                    | "backedUp"
                    | "transports"
                    | "createdAt"
                    | "aaguid"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthApplication";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "icon"
                    | "metadata"
                    | "clientId"
                    | "clientSecret"
                    | "redirectURLs"
                    | "type"
                    | "disabled"
                    | "userId"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthAccessToken";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accessToken"
                    | "refreshToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "clientId"
                    | "userId"
                    | "scopes"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthConsent";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "clientId"
                    | "userId"
                    | "scopes"
                    | "createdAt"
                    | "updatedAt"
                    | "consentGiven"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "team";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "organizationId"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "teamMember";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "teamId" | "userId" | "createdAt" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "organization";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "slug"
                    | "logo"
                    | "createdAt"
                    | "metadata"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "member";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "organizationId"
                    | "userId"
                    | "role"
                    | "createdAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "invitation";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "organizationId"
                    | "email"
                    | "role"
                    | "teamId"
                    | "status"
                    | "expiresAt"
                    | "inviterId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "ssoProvider";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "issuer"
                    | "oidcConfig"
                    | "samlConfig"
                    | "userId"
                    | "providerId"
                    | "organizationId"
                    | "domain"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "jwks";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "publicKey" | "privateKey" | "createdAt" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "subscription";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "plan"
                    | "referenceId"
                    | "stripeCustomerId"
                    | "stripeSubscriptionId"
                    | "status"
                    | "periodStart"
                    | "periodEnd"
                    | "trialStart"
                    | "trialEnd"
                    | "cancelAtPeriodEnd"
                    | "seats"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "walletAddress";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "userId"
                    | "address"
                    | "chainId"
                    | "isPrimary"
                    | "createdAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "rateLimit";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "key" | "count" | "lastRequest" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "ratelimit";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "key" | "count" | "lastRequest" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              };
          onDeleteHandle?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        any
      >;
      deleteOne: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "twoFactorEnabled"
                    | "isAnonymous"
                    | "username"
                    | "displayUsername"
                    | "phoneNumber"
                    | "phoneNumberVerified"
                    | "userId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "session";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "account";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "verification";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "twoFactor";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "secret" | "backupCodes" | "userId" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "passkey";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "publicKey"
                    | "userId"
                    | "credentialID"
                    | "counter"
                    | "deviceType"
                    | "backedUp"
                    | "transports"
                    | "createdAt"
                    | "aaguid"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthApplication";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "icon"
                    | "metadata"
                    | "clientId"
                    | "clientSecret"
                    | "redirectURLs"
                    | "type"
                    | "disabled"
                    | "userId"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthAccessToken";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accessToken"
                    | "refreshToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "clientId"
                    | "userId"
                    | "scopes"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthConsent";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "clientId"
                    | "userId"
                    | "scopes"
                    | "createdAt"
                    | "updatedAt"
                    | "consentGiven"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "team";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "organizationId"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "teamMember";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "teamId" | "userId" | "createdAt" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "organization";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "slug"
                    | "logo"
                    | "createdAt"
                    | "metadata"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "member";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "organizationId"
                    | "userId"
                    | "role"
                    | "createdAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "invitation";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "organizationId"
                    | "email"
                    | "role"
                    | "teamId"
                    | "status"
                    | "expiresAt"
                    | "inviterId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "ssoProvider";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "issuer"
                    | "oidcConfig"
                    | "samlConfig"
                    | "userId"
                    | "providerId"
                    | "organizationId"
                    | "domain"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "jwks";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "publicKey" | "privateKey" | "createdAt" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "subscription";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "plan"
                    | "referenceId"
                    | "stripeCustomerId"
                    | "stripeSubscriptionId"
                    | "status"
                    | "periodStart"
                    | "periodEnd"
                    | "trialStart"
                    | "trialEnd"
                    | "cancelAtPeriodEnd"
                    | "seats"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "walletAddress";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "userId"
                    | "address"
                    | "chainId"
                    | "isPrimary"
                    | "createdAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "rateLimit";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "key" | "count" | "lastRequest" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "ratelimit";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "key" | "count" | "lastRequest" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              };
          onDeleteHandle?: string;
        },
        any
      >;
      findMany: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          model:
            | "user"
            | "session"
            | "account"
            | "verification"
            | "twoFactor"
            | "passkey"
            | "oauthApplication"
            | "oauthAccessToken"
            | "oauthConsent"
            | "team"
            | "teamMember"
            | "organization"
            | "member"
            | "invitation"
            | "ssoProvider"
            | "jwks"
            | "subscription"
            | "walletAddress"
            | "rateLimit"
            | "ratelimit";
          offset?: number;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          sortBy?: { direction: "asc" | "desc"; field: string };
          where?: Array<{
            connector?: "AND" | "OR";
            field: string;
            operator?:
              | "lt"
              | "lte"
              | "gt"
              | "gte"
              | "eq"
              | "in"
              | "ne"
              | "contains"
              | "starts_with"
              | "ends_with";
            value:
              | string
              | number
              | boolean
              | Array<string>
              | Array<number>
              | null;
          }>;
        },
        any
      >;
      findOne: FunctionReference<
        "query",
        "internal",
        {
          model:
            | "user"
            | "session"
            | "account"
            | "verification"
            | "twoFactor"
            | "passkey"
            | "oauthApplication"
            | "oauthAccessToken"
            | "oauthConsent"
            | "team"
            | "teamMember"
            | "organization"
            | "member"
            | "invitation"
            | "ssoProvider"
            | "jwks"
            | "subscription"
            | "walletAddress"
            | "rateLimit"
            | "ratelimit";
          select?: Array<string>;
          where?: Array<{
            connector?: "AND" | "OR";
            field: string;
            operator?:
              | "lt"
              | "lte"
              | "gt"
              | "gte"
              | "eq"
              | "in"
              | "ne"
              | "contains"
              | "starts_with"
              | "ends_with";
            value:
              | string
              | number
              | boolean
              | Array<string>
              | Array<number>
              | null;
          }>;
        },
        any
      >;
      updateMany: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user";
                update: {
                  createdAt?: number;
                  displayUsername?: null | string;
                  email?: string;
                  emailVerified?: boolean;
                  image?: null | string;
                  isAnonymous?: null | boolean;
                  name?: string;
                  phoneNumber?: null | string;
                  phoneNumberVerified?: null | boolean;
                  twoFactorEnabled?: null | boolean;
                  updatedAt?: number;
                  userId?: null | string;
                  username?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "twoFactorEnabled"
                    | "isAnonymous"
                    | "username"
                    | "displayUsername"
                    | "phoneNumber"
                    | "phoneNumberVerified"
                    | "userId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "session";
                update: {
                  createdAt?: number;
                  expiresAt?: number;
                  ipAddress?: null | string;
                  token?: string;
                  updatedAt?: number;
                  userAgent?: null | string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "account";
                update: {
                  accessToken?: null | string;
                  accessTokenExpiresAt?: null | number;
                  accountId?: string;
                  createdAt?: number;
                  idToken?: null | string;
                  password?: null | string;
                  providerId?: string;
                  refreshToken?: null | string;
                  refreshTokenExpiresAt?: null | number;
                  scope?: null | string;
                  updatedAt?: number;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "verification";
                update: {
                  createdAt?: number;
                  expiresAt?: number;
                  identifier?: string;
                  updatedAt?: number;
                  value?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "twoFactor";
                update: {
                  backupCodes?: string;
                  secret?: string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "secret" | "backupCodes" | "userId" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "passkey";
                update: {
                  aaguid?: null | string;
                  backedUp?: boolean;
                  counter?: number;
                  createdAt?: null | number;
                  credentialID?: string;
                  deviceType?: string;
                  name?: null | string;
                  publicKey?: string;
                  transports?: null | string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "publicKey"
                    | "userId"
                    | "credentialID"
                    | "counter"
                    | "deviceType"
                    | "backedUp"
                    | "transports"
                    | "createdAt"
                    | "aaguid"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthApplication";
                update: {
                  clientId?: null | string;
                  clientSecret?: null | string;
                  createdAt?: null | number;
                  disabled?: null | boolean;
                  icon?: null | string;
                  metadata?: null | string;
                  name?: null | string;
                  redirectURLs?: null | string;
                  type?: null | string;
                  updatedAt?: null | number;
                  userId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "icon"
                    | "metadata"
                    | "clientId"
                    | "clientSecret"
                    | "redirectURLs"
                    | "type"
                    | "disabled"
                    | "userId"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthAccessToken";
                update: {
                  accessToken?: null | string;
                  accessTokenExpiresAt?: null | number;
                  clientId?: null | string;
                  createdAt?: null | number;
                  refreshToken?: null | string;
                  refreshTokenExpiresAt?: null | number;
                  scopes?: null | string;
                  updatedAt?: null | number;
                  userId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accessToken"
                    | "refreshToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "clientId"
                    | "userId"
                    | "scopes"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthConsent";
                update: {
                  clientId?: null | string;
                  consentGiven?: null | boolean;
                  createdAt?: null | number;
                  scopes?: null | string;
                  updatedAt?: null | number;
                  userId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "clientId"
                    | "userId"
                    | "scopes"
                    | "createdAt"
                    | "updatedAt"
                    | "consentGiven"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "team";
                update: {
                  createdAt?: number;
                  name?: string;
                  organizationId?: string;
                  updatedAt?: null | number;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "organizationId"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "teamMember";
                update: {
                  createdAt?: null | number;
                  teamId?: string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "teamId" | "userId" | "createdAt" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "organization";
                update: {
                  createdAt?: number;
                  logo?: null | string;
                  metadata?: null | string;
                  name?: string;
                  slug?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "slug"
                    | "logo"
                    | "createdAt"
                    | "metadata"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "member";
                update: {
                  createdAt?: number;
                  organizationId?: string;
                  role?: string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "organizationId"
                    | "userId"
                    | "role"
                    | "createdAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "invitation";
                update: {
                  email?: string;
                  expiresAt?: number;
                  inviterId?: string;
                  organizationId?: string;
                  role?: null | string;
                  status?: string;
                  teamId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "organizationId"
                    | "email"
                    | "role"
                    | "teamId"
                    | "status"
                    | "expiresAt"
                    | "inviterId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "ssoProvider";
                update: {
                  domain?: string;
                  issuer?: string;
                  oidcConfig?: null | string;
                  organizationId?: null | string;
                  providerId?: string;
                  samlConfig?: null | string;
                  userId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "issuer"
                    | "oidcConfig"
                    | "samlConfig"
                    | "userId"
                    | "providerId"
                    | "organizationId"
                    | "domain"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "jwks";
                update: {
                  createdAt?: number;
                  privateKey?: string;
                  publicKey?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "publicKey" | "privateKey" | "createdAt" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "subscription";
                update: {
                  cancelAtPeriodEnd?: null | boolean;
                  periodEnd?: null | number;
                  periodStart?: null | number;
                  plan?: string;
                  referenceId?: string;
                  seats?: null | number;
                  status?: null | string;
                  stripeCustomerId?: null | string;
                  stripeSubscriptionId?: null | string;
                  trialEnd?: null | number;
                  trialStart?: null | number;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "plan"
                    | "referenceId"
                    | "stripeCustomerId"
                    | "stripeSubscriptionId"
                    | "status"
                    | "periodStart"
                    | "periodEnd"
                    | "trialStart"
                    | "trialEnd"
                    | "cancelAtPeriodEnd"
                    | "seats"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "walletAddress";
                update: {
                  address?: string;
                  chainId?: number;
                  createdAt?: number;
                  isPrimary?: null | boolean;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "userId"
                    | "address"
                    | "chainId"
                    | "isPrimary"
                    | "createdAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "rateLimit";
                update: {
                  count?: null | number;
                  key?: null | string;
                  lastRequest?: null | number;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "key" | "count" | "lastRequest" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "ratelimit";
                update: { count?: number; key?: string; lastRequest?: number };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "key" | "count" | "lastRequest" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              };
          onUpdateHandle?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        any
      >;
      updateOne: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user";
                update: {
                  createdAt?: number;
                  displayUsername?: null | string;
                  email?: string;
                  emailVerified?: boolean;
                  image?: null | string;
                  isAnonymous?: null | boolean;
                  name?: string;
                  phoneNumber?: null | string;
                  phoneNumberVerified?: null | boolean;
                  twoFactorEnabled?: null | boolean;
                  updatedAt?: number;
                  userId?: null | string;
                  username?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "twoFactorEnabled"
                    | "isAnonymous"
                    | "username"
                    | "displayUsername"
                    | "phoneNumber"
                    | "phoneNumberVerified"
                    | "userId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "session";
                update: {
                  createdAt?: number;
                  expiresAt?: number;
                  ipAddress?: null | string;
                  token?: string;
                  updatedAt?: number;
                  userAgent?: null | string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "account";
                update: {
                  accessToken?: null | string;
                  accessTokenExpiresAt?: null | number;
                  accountId?: string;
                  createdAt?: number;
                  idToken?: null | string;
                  password?: null | string;
                  providerId?: string;
                  refreshToken?: null | string;
                  refreshTokenExpiresAt?: null | number;
                  scope?: null | string;
                  updatedAt?: number;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "verification";
                update: {
                  createdAt?: number;
                  expiresAt?: number;
                  identifier?: string;
                  updatedAt?: number;
                  value?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "twoFactor";
                update: {
                  backupCodes?: string;
                  secret?: string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "secret" | "backupCodes" | "userId" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "passkey";
                update: {
                  aaguid?: null | string;
                  backedUp?: boolean;
                  counter?: number;
                  createdAt?: null | number;
                  credentialID?: string;
                  deviceType?: string;
                  name?: null | string;
                  publicKey?: string;
                  transports?: null | string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "publicKey"
                    | "userId"
                    | "credentialID"
                    | "counter"
                    | "deviceType"
                    | "backedUp"
                    | "transports"
                    | "createdAt"
                    | "aaguid"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthApplication";
                update: {
                  clientId?: null | string;
                  clientSecret?: null | string;
                  createdAt?: null | number;
                  disabled?: null | boolean;
                  icon?: null | string;
                  metadata?: null | string;
                  name?: null | string;
                  redirectURLs?: null | string;
                  type?: null | string;
                  updatedAt?: null | number;
                  userId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "icon"
                    | "metadata"
                    | "clientId"
                    | "clientSecret"
                    | "redirectURLs"
                    | "type"
                    | "disabled"
                    | "userId"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthAccessToken";
                update: {
                  accessToken?: null | string;
                  accessTokenExpiresAt?: null | number;
                  clientId?: null | string;
                  createdAt?: null | number;
                  refreshToken?: null | string;
                  refreshTokenExpiresAt?: null | number;
                  scopes?: null | string;
                  updatedAt?: null | number;
                  userId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accessToken"
                    | "refreshToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "clientId"
                    | "userId"
                    | "scopes"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "oauthConsent";
                update: {
                  clientId?: null | string;
                  consentGiven?: null | boolean;
                  createdAt?: null | number;
                  scopes?: null | string;
                  updatedAt?: null | number;
                  userId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "clientId"
                    | "userId"
                    | "scopes"
                    | "createdAt"
                    | "updatedAt"
                    | "consentGiven"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "team";
                update: {
                  createdAt?: number;
                  name?: string;
                  organizationId?: string;
                  updatedAt?: null | number;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "organizationId"
                    | "createdAt"
                    | "updatedAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "teamMember";
                update: {
                  createdAt?: null | number;
                  teamId?: string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "teamId" | "userId" | "createdAt" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "organization";
                update: {
                  createdAt?: number;
                  logo?: null | string;
                  metadata?: null | string;
                  name?: string;
                  slug?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "slug"
                    | "logo"
                    | "createdAt"
                    | "metadata"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "member";
                update: {
                  createdAt?: number;
                  organizationId?: string;
                  role?: string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "organizationId"
                    | "userId"
                    | "role"
                    | "createdAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "invitation";
                update: {
                  email?: string;
                  expiresAt?: number;
                  inviterId?: string;
                  organizationId?: string;
                  role?: null | string;
                  status?: string;
                  teamId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "organizationId"
                    | "email"
                    | "role"
                    | "teamId"
                    | "status"
                    | "expiresAt"
                    | "inviterId"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "ssoProvider";
                update: {
                  domain?: string;
                  issuer?: string;
                  oidcConfig?: null | string;
                  organizationId?: null | string;
                  providerId?: string;
                  samlConfig?: null | string;
                  userId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "issuer"
                    | "oidcConfig"
                    | "samlConfig"
                    | "userId"
                    | "providerId"
                    | "organizationId"
                    | "domain"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "jwks";
                update: {
                  createdAt?: number;
                  privateKey?: string;
                  publicKey?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "publicKey" | "privateKey" | "createdAt" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "subscription";
                update: {
                  cancelAtPeriodEnd?: null | boolean;
                  periodEnd?: null | number;
                  periodStart?: null | number;
                  plan?: string;
                  referenceId?: string;
                  seats?: null | number;
                  status?: null | string;
                  stripeCustomerId?: null | string;
                  stripeSubscriptionId?: null | string;
                  trialEnd?: null | number;
                  trialStart?: null | number;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "plan"
                    | "referenceId"
                    | "stripeCustomerId"
                    | "stripeSubscriptionId"
                    | "status"
                    | "periodStart"
                    | "periodEnd"
                    | "trialStart"
                    | "trialEnd"
                    | "cancelAtPeriodEnd"
                    | "seats"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "walletAddress";
                update: {
                  address?: string;
                  chainId?: number;
                  createdAt?: number;
                  isPrimary?: null | boolean;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "userId"
                    | "address"
                    | "chainId"
                    | "isPrimary"
                    | "createdAt"
                    | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "rateLimit";
                update: {
                  count?: null | number;
                  key?: null | string;
                  lastRequest?: null | number;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "key" | "count" | "lastRequest" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "ratelimit";
                update: { count?: number; key?: string; lastRequest?: number };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field: "key" | "count" | "lastRequest" | "id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              };
          onUpdateHandle?: string;
        },
        any
      >;
    };
    adapterTest: {
      count: FunctionReference<"query", "internal", any, any>;
      create: FunctionReference<"mutation", "internal", any, any>;
      delete: FunctionReference<"mutation", "internal", any, any>;
      deleteMany: FunctionReference<"mutation", "internal", any, any>;
      findMany: FunctionReference<"query", "internal", any, any>;
      findOne: FunctionReference<"query", "internal", any, any>;
      update: FunctionReference<"mutation", "internal", any, any>;
      updateMany: FunctionReference<"mutation", "internal", any, any>;
    };
  };
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          createdAt: number;
          errorMessage?: string;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject: string;
          text?: string;
          to: string;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          errorMessage: string | null;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject: string;
          text?: string;
          to: string;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
  crons: {
    public: {
      del: FunctionReference<
        "mutation",
        "internal",
        { identifier: { id: string } | { name: string } },
        null
      >;
      get: FunctionReference<
        "query",
        "internal",
        { identifier: { id: string } | { name: string } },
        {
          args: Record<string, any>;
          functionHandle: string;
          id: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        } | null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          args: Record<string, any>;
          functionHandle: string;
          id: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        }>
      >;
      register: FunctionReference<
        "mutation",
        "internal",
        {
          args: Record<string, any>;
          functionHandle: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        },
        string
      >;
    };
  };
  agent: {
    apiKeys: {
      destroy: FunctionReference<
        "mutation",
        "internal",
        { apiKey?: string; name?: string },
        | "missing"
        | "deleted"
        | "name mismatch"
        | "must provide either apiKey or name"
      >;
      issue: FunctionReference<
        "mutation",
        "internal",
        { name?: string },
        string
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { apiKey: string },
        boolean
      >;
    };
    files: {
      addFile: FunctionReference<
        "mutation",
        "internal",
        {
          filename?: string;
          hash: string;
          mimeType: string;
          storageId: string;
        },
        { fileId: string; storageId: string }
      >;
      copyFile: FunctionReference<
        "mutation",
        "internal",
        { fileId: string },
        null
      >;
      deleteFiles: FunctionReference<
        "mutation",
        "internal",
        { fileIds: Array<string>; force?: boolean },
        Array<string>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { fileId: string },
        null | {
          _creationTime: number;
          _id: string;
          filename?: string;
          hash: string;
          lastTouchedAt: number;
          mimeType: string;
          refcount: number;
          storageId: string;
        }
      >;
      getFilesToDelete: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            filename?: string;
            hash: string;
            lastTouchedAt: number;
            mimeType: string;
            refcount: number;
            storageId: string;
          }>;
        }
      >;
      useExistingFile: FunctionReference<
        "mutation",
        "internal",
        { filename?: string; hash: string },
        null | { fileId: string; storageId: string }
      >;
    };
    messages: {
      addMessages: FunctionReference<
        "mutation",
        "internal",
        {
          agentName?: string;
          embeddings?: {
            dimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
            model: string;
            vectors: Array<Array<number> | null>;
          };
          failPendingSteps?: boolean;
          messages: Array<{
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            message:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | { type: "text"; value: string }
                              | { type: "json"; value: any }
                              | { type: "error-text"; value: string }
                              | { type: "error-json"; value: any }
                              | {
                                  type: "content";
                                  value: Array<
                                    | { text: string; type: "text" }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<{
                    args?: any;
                    experimental_content?: Array<
                      | { text: string; type: "text" }
                      | { data: string; mimeType?: string; type: "image" }
                    >;
                    isError?: boolean;
                    output?:
                      | { type: "text"; value: string }
                      | { type: "json"; value: any }
                      | { type: "error-text"; value: string }
                      | { type: "error-json"; value: any }
                      | {
                          type: "content";
                          value: Array<
                            | { text: string; type: "text" }
                            | { data: string; mediaType: string; type: "media" }
                          >;
                        };
                    providerExecuted?: boolean;
                    providerMetadata?: Record<string, Record<string, any>>;
                    providerOptions?: Record<string, Record<string, any>>;
                    result?: any;
                    toolCallId: string;
                    toolName: string;
                    type: "tool-result";
                  }>;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status?: "pending" | "success" | "failed";
            text?: string;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
          pendingMessageId?: string;
          promptMessageId?: string;
          threadId: string;
          userId?: string;
        },
        {
          messages: Array<{
            _creationTime: number;
            _id: string;
            agentName?: string;
            embeddingId?: string;
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            id?: string;
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | { type: "text"; value: string }
                              | { type: "json"; value: any }
                              | { type: "error-text"; value: string }
                              | { type: "error-json"; value: any }
                              | {
                                  type: "content";
                                  value: Array<
                                    | { text: string; type: "text" }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<{
                    args?: any;
                    experimental_content?: Array<
                      | { text: string; type: "text" }
                      | { data: string; mimeType?: string; type: "image" }
                    >;
                    isError?: boolean;
                    output?:
                      | { type: "text"; value: string }
                      | { type: "json"; value: any }
                      | { type: "error-text"; value: string }
                      | { type: "error-json"; value: any }
                      | {
                          type: "content";
                          value: Array<
                            | { text: string; type: "text" }
                            | { data: string; mediaType: string; type: "media" }
                          >;
                        };
                    providerExecuted?: boolean;
                    providerMetadata?: Record<string, Record<string, any>>;
                    providerOptions?: Record<string, Record<string, any>>;
                    result?: any;
                    toolCallId: string;
                    toolName: string;
                    type: "tool-result";
                  }>;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            order: number;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            providerOptions?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status: "pending" | "success" | "failed";
            stepOrder: number;
            text?: string;
            threadId: string;
            tool: boolean;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            userId?: string;
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
        }
      >;
      deleteByIds: FunctionReference<
        "mutation",
        "internal",
        { messageIds: Array<string> },
        Array<string>
      >;
      deleteByOrder: FunctionReference<
        "mutation",
        "internal",
        {
          endOrder: number;
          endStepOrder?: number;
          startOrder: number;
          startStepOrder?: number;
          threadId: string;
        },
        { isDone: boolean; lastOrder?: number; lastStepOrder?: number }
      >;
      finalizeMessage: FunctionReference<
        "mutation",
        "internal",
        {
          messageId: string;
          result: { status: "success" } | { error: string; status: "failed" };
        },
        null
      >;
      getMessageSearchFields: FunctionReference<
        "query",
        "internal",
        { messageId: string },
        { embedding?: Array<number>; embeddingModel?: string; text?: string }
      >;
      getMessagesByIds: FunctionReference<
        "query",
        "internal",
        { messageIds: Array<string> },
        Array<null | {
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | { type: "text"; value: string }
                            | { type: "json"; value: any }
                            | { type: "error-text"; value: string }
                            | { type: "error-json"; value: any }
                            | {
                                type: "content";
                                value: Array<
                                  | { text: string; type: "text" }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<{
                  args?: any;
                  experimental_content?: Array<
                    | { text: string; type: "text" }
                    | { data: string; mimeType?: string; type: "image" }
                  >;
                  isError?: boolean;
                  output?:
                    | { type: "text"; value: string }
                    | { type: "json"; value: any }
                    | { type: "error-text"; value: string }
                    | { type: "error-json"; value: any }
                    | {
                        type: "content";
                        value: Array<
                          | { text: string; type: "text" }
                          | { data: string; mediaType: string; type: "media" }
                        >;
                      };
                  providerExecuted?: boolean;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  result?: any;
                  toolCallId: string;
                  toolName: string;
                  type: "tool-result";
                }>;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      listMessagesByThreadId: FunctionReference<
        "query",
        "internal",
        {
          excludeToolMessages?: boolean;
          order: "asc" | "desc";
          paginationOpts?: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          statuses?: Array<"pending" | "success" | "failed">;
          threadId: string;
          upToAndIncludingMessageId?: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            agentName?: string;
            embeddingId?: string;
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            id?: string;
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | { type: "text"; value: string }
                              | { type: "json"; value: any }
                              | { type: "error-text"; value: string }
                              | { type: "error-json"; value: any }
                              | {
                                  type: "content";
                                  value: Array<
                                    | { text: string; type: "text" }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<{
                    args?: any;
                    experimental_content?: Array<
                      | { text: string; type: "text" }
                      | { data: string; mimeType?: string; type: "image" }
                    >;
                    isError?: boolean;
                    output?:
                      | { type: "text"; value: string }
                      | { type: "json"; value: any }
                      | { type: "error-text"; value: string }
                      | { type: "error-json"; value: any }
                      | {
                          type: "content";
                          value: Array<
                            | { text: string; type: "text" }
                            | { data: string; mediaType: string; type: "media" }
                          >;
                        };
                    providerExecuted?: boolean;
                    providerMetadata?: Record<string, Record<string, any>>;
                    providerOptions?: Record<string, Record<string, any>>;
                    result?: any;
                    toolCallId: string;
                    toolName: string;
                    type: "tool-result";
                  }>;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            order: number;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            providerOptions?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status: "pending" | "success" | "failed";
            stepOrder: number;
            text?: string;
            threadId: string;
            tool: boolean;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            userId?: string;
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      searchMessages: FunctionReference<
        "action",
        "internal",
        {
          embedding?: Array<number>;
          embeddingModel?: string;
          limit: number;
          messageRange?: { after: number; before: number };
          searchAllMessagesForUserId?: string;
          targetMessageId?: string;
          text?: string;
          textSearch?: boolean;
          threadId?: string;
          vectorScoreThreshold?: number;
          vectorSearch?: boolean;
        },
        Array<{
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | { type: "text"; value: string }
                            | { type: "json"; value: any }
                            | { type: "error-text"; value: string }
                            | { type: "error-json"; value: any }
                            | {
                                type: "content";
                                value: Array<
                                  | { text: string; type: "text" }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<{
                  args?: any;
                  experimental_content?: Array<
                    | { text: string; type: "text" }
                    | { data: string; mimeType?: string; type: "image" }
                  >;
                  isError?: boolean;
                  output?:
                    | { type: "text"; value: string }
                    | { type: "json"; value: any }
                    | { type: "error-text"; value: string }
                    | { type: "error-json"; value: any }
                    | {
                        type: "content";
                        value: Array<
                          | { text: string; type: "text" }
                          | { data: string; mediaType: string; type: "media" }
                        >;
                      };
                  providerExecuted?: boolean;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  result?: any;
                  toolCallId: string;
                  toolName: string;
                  type: "tool-result";
                }>;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      textSearch: FunctionReference<
        "query",
        "internal",
        {
          limit: number;
          searchAllMessagesForUserId?: string;
          targetMessageId?: string;
          text?: string;
          threadId?: string;
        },
        Array<{
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | { type: "text"; value: string }
                            | { type: "json"; value: any }
                            | { type: "error-text"; value: string }
                            | { type: "error-json"; value: any }
                            | {
                                type: "content";
                                value: Array<
                                  | { text: string; type: "text" }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<{
                  args?: any;
                  experimental_content?: Array<
                    | { text: string; type: "text" }
                    | { data: string; mimeType?: string; type: "image" }
                  >;
                  isError?: boolean;
                  output?:
                    | { type: "text"; value: string }
                    | { type: "json"; value: any }
                    | { type: "error-text"; value: string }
                    | { type: "error-json"; value: any }
                    | {
                        type: "content";
                        value: Array<
                          | { text: string; type: "text" }
                          | { data: string; mediaType: string; type: "media" }
                        >;
                      };
                  providerExecuted?: boolean;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  result?: any;
                  toolCallId: string;
                  toolName: string;
                  type: "tool-result";
                }>;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      updateMessage: FunctionReference<
        "mutation",
        "internal",
        {
          messageId: string;
          patch: {
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | { type: "text"; value: string }
                              | { type: "json"; value: any }
                              | { type: "error-text"; value: string }
                              | { type: "error-json"; value: any }
                              | {
                                  type: "content";
                                  value: Array<
                                    | { text: string; type: "text" }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<{
                    args?: any;
                    experimental_content?: Array<
                      | { text: string; type: "text" }
                      | { data: string; mimeType?: string; type: "image" }
                    >;
                    isError?: boolean;
                    output?:
                      | { type: "text"; value: string }
                      | { type: "json"; value: any }
                      | { type: "error-text"; value: string }
                      | { type: "error-json"; value: any }
                      | {
                          type: "content";
                          value: Array<
                            | { text: string; type: "text" }
                            | { data: string; mediaType: string; type: "media" }
                          >;
                        };
                    providerExecuted?: boolean;
                    providerMetadata?: Record<string, Record<string, any>>;
                    providerOptions?: Record<string, Record<string, any>>;
                    result?: any;
                    toolCallId: string;
                    toolName: string;
                    type: "tool-result";
                  }>;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            provider?: string;
            providerOptions?: Record<string, Record<string, any>>;
            status?: "pending" | "success" | "failed";
          };
        },
        {
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | { type: "text"; value: string }
                            | { type: "json"; value: any }
                            | { type: "error-text"; value: string }
                            | { type: "error-json"; value: any }
                            | {
                                type: "content";
                                value: Array<
                                  | { text: string; type: "text" }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<{
                  args?: any;
                  experimental_content?: Array<
                    | { text: string; type: "text" }
                    | { data: string; mimeType?: string; type: "image" }
                  >;
                  isError?: boolean;
                  output?:
                    | { type: "text"; value: string }
                    | { type: "json"; value: any }
                    | { type: "error-text"; value: string }
                    | { type: "error-json"; value: any }
                    | {
                        type: "content";
                        value: Array<
                          | { text: string; type: "text" }
                          | { data: string; mediaType: string; type: "media" }
                        >;
                      };
                  providerExecuted?: boolean;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  result?: any;
                  toolCallId: string;
                  toolName: string;
                  type: "tool-result";
                }>;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }
      >;
    };
    streams: {
      abort: FunctionReference<
        "mutation",
        "internal",
        {
          finalDelta?: {
            end: number;
            parts: Array<any>;
            start: number;
            streamId: string;
          };
          reason: string;
          streamId: string;
        },
        boolean
      >;
      abortByOrder: FunctionReference<
        "mutation",
        "internal",
        { order: number; reason: string; threadId: string },
        boolean
      >;
      addDelta: FunctionReference<
        "mutation",
        "internal",
        { end: number; parts: Array<any>; start: number; streamId: string },
        boolean
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          agentName?: string;
          format?: "UIMessageChunk" | "TextStreamPart";
          model?: string;
          order: number;
          provider?: string;
          providerOptions?: Record<string, Record<string, any>>;
          stepOrder: number;
          threadId: string;
          userId?: string;
        },
        string
      >;
      deleteAllStreamsForThreadIdAsync: FunctionReference<
        "mutation",
        "internal",
        { deltaCursor?: string; streamOrder?: number; threadId: string },
        { deltaCursor?: string; isDone: boolean; streamOrder?: number }
      >;
      deleteAllStreamsForThreadIdSync: FunctionReference<
        "action",
        "internal",
        { threadId: string },
        null
      >;
      deleteStreamAsync: FunctionReference<
        "mutation",
        "internal",
        { cursor?: string; streamId: string },
        null
      >;
      deleteStreamSync: FunctionReference<
        "mutation",
        "internal",
        { streamId: string },
        null
      >;
      finish: FunctionReference<
        "mutation",
        "internal",
        {
          finalDelta?: {
            end: number;
            parts: Array<any>;
            start: number;
            streamId: string;
          };
          streamId: string;
        },
        null
      >;
      heartbeat: FunctionReference<
        "mutation",
        "internal",
        { streamId: string },
        null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          startOrder?: number;
          statuses?: Array<"streaming" | "finished" | "aborted">;
          threadId: string;
        },
        Array<{
          agentName?: string;
          format?: "UIMessageChunk" | "TextStreamPart";
          model?: string;
          order: number;
          provider?: string;
          providerOptions?: Record<string, Record<string, any>>;
          status: "streaming" | "finished" | "aborted";
          stepOrder: number;
          streamId: string;
          userId?: string;
        }>
      >;
      listDeltas: FunctionReference<
        "query",
        "internal",
        {
          cursors: Array<{ cursor: number; streamId: string }>;
          threadId: string;
        },
        Array<{
          end: number;
          parts: Array<any>;
          start: number;
          streamId: string;
        }>
      >;
    };
    threads: {
      createThread: FunctionReference<
        "mutation",
        "internal",
        {
          defaultSystemPrompt?: string;
          parentThreadIds?: Array<string>;
          summary?: string;
          title?: string;
          userId?: string;
        },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }
      >;
      deleteAllForThreadIdAsync: FunctionReference<
        "mutation",
        "internal",
        {
          cursor?: string;
          deltaCursor?: string;
          limit?: number;
          messagesDone?: boolean;
          streamOrder?: number;
          streamsDone?: boolean;
          threadId: string;
        },
        { isDone: boolean }
      >;
      deleteAllForThreadIdSync: FunctionReference<
        "action",
        "internal",
        { limit?: number; threadId: string },
        null
      >;
      getThread: FunctionReference<
        "query",
        "internal",
        { threadId: string },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        } | null
      >;
      listThreadsByUserId: FunctionReference<
        "query",
        "internal",
        {
          order?: "asc" | "desc";
          paginationOpts?: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          userId?: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            status: "active" | "archived";
            summary?: string;
            title?: string;
            userId?: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      searchThreadTitles: FunctionReference<
        "query",
        "internal",
        { limit: number; query: string; userId?: string | null },
        Array<{
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }>
      >;
      updateThread: FunctionReference<
        "mutation",
        "internal",
        {
          patch: {
            status?: "active" | "archived";
            summary?: string;
            title?: string;
            userId?: string;
          };
          threadId: string;
        },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }
      >;
    };
    users: {
      deleteAllForUserId: FunctionReference<
        "action",
        "internal",
        { userId: string },
        null
      >;
      deleteAllForUserIdAsync: FunctionReference<
        "mutation",
        "internal",
        { userId: string },
        boolean
      >;
      listUsersWithThreads: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<string>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
    };
    vector: {
      index: {
        deleteBatch: FunctionReference<
          "mutation",
          "internal",
          {
            ids: Array<
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
            >;
          },
          null
        >;
        deleteBatchForThread: FunctionReference<
          "mutation",
          "internal",
          {
            cursor?: string;
            limit: number;
            model: string;
            threadId: string;
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
          },
          { continueCursor: string; isDone: boolean }
        >;
        insertBatch: FunctionReference<
          "mutation",
          "internal",
          {
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
            vectors: Array<{
              messageId?: string;
              model: string;
              table: string;
              threadId?: string;
              userId?: string;
              vector: Array<number>;
            }>;
          },
          Array<
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
          >
        >;
        paginate: FunctionReference<
          "query",
          "internal",
          {
            cursor?: string;
            limit: number;
            table?: string;
            targetModel: string;
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
          },
          {
            continueCursor: string;
            ids: Array<
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
            >;
            isDone: boolean;
          }
        >;
        updateBatch: FunctionReference<
          "mutation",
          "internal",
          {
            vectors: Array<{
              id:
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string;
              model: string;
              vector: Array<number>;
            }>;
          },
          null
        >;
      };
    };
  };
};

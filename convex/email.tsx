import { Resend } from "@convex-dev/resend";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { readMailConfigFromEnv, type MailConfig } from "../shared/config";
import { normalizeMailUrl } from "../shared/mail/url";
import { GenericCtx } from "@convex-dev/better-auth";
import { requireMutationCtx } from "@convex-dev/better-auth/utils";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import MagicLinkEmail from "./emails/magicLink";
import ResetPasswordEmail from "./emails/resetPassword";
import VerifyEmail from "./emails/verifyEmail";
import VerifyOTP from "./emails/verifyOTP";

interface SendEmailOptions {
  ctx: GenericCtx<DataModel>;
  mail: MailConfig;
  to: string;
  subject: string;
  type: string;
  template: ReactElement;
}

const dispatchEmail = async ({
  ctx,
  mail,
  to,
  subject,
  type,
  template,
}: SendEmailOptions) => {
  const html = await render(template);
  const text = await render(template, { plainText: true });

  if (mail.preview) {
    console.log(
      `[mail preview] ${JSON.stringify(
        {
          type,
          to,
          from: mail.from,
          subject,
          brand: mail.brand,
          html,
          text,
        },
        null,
        2,
      )}`,
    );
    return;
  }

  const mutationCtx = (() => {
    try {
      return requireMutationCtx(ctx);
    } catch {
      if (
        ctx &&
        "runMutation" in ctx &&
        typeof ctx.runMutation === "function"
      ) {
        return ctx as MutationCtx; 
      }
      throw new Error("Could not establish a valid mutation context.");
    }
  })();

  if (mail.errors.length > 0) {
    throw new Error(`Mail configuration invalid: ${mail.errors.join(" | ")}`);
  }

  if (!mail.resendApiKey) {
    throw new Error(
      "RESEND_API_KEY is required when MAIL_CONSOLE_PREVIEW=false.",
    );
  }

  const resend = new Resend(components.resend, {
    apiKey: mail.resendApiKey,
    testMode: false,
  });

  await resend.sendEmail(mutationCtx, {
    from: mail.from,
    to,
    subject,
    html,
    text,
  });
};

function getMailConfig(): MailConfig {
  return readMailConfigFromEnv(
    process.env as Record<string, string | undefined>,
  );
}

export const sendEmailVerification = async (
  ctx: GenericCtx<DataModel>,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  },
) => {
  const mail = getMailConfig();
  const normalizedUrl = normalizeMailUrl(url);
  await dispatchEmail({
    ctx,
    mail,
    to,
    subject: "Verify your email address",
    type: "emailVerification",
    template: <VerifyEmail url={normalizedUrl} brand={mail.brand} />,
  });
};

export const sendOTPVerification = async (
  ctx: GenericCtx<DataModel>,
  {
    to,
    code,
  }: {
    to: string;
    code: string;
  },
) => {
  const mail = getMailConfig();
  await dispatchEmail({
    ctx,
    mail,
    to,
    subject: "Verify your email address",
    type: "otpVerification",
    template: <VerifyOTP code={code} brand={mail.brand} />,
  });
};

export const sendMagicLink = async (
  ctx: GenericCtx<DataModel>,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  },
) => {
  const mail = getMailConfig();
  const normalizedUrl = normalizeMailUrl(url);
  await dispatchEmail({
    ctx,
    mail,
    to,
    subject: "Sign in to your account",
    type: "magicLink",
    template: <MagicLinkEmail url={normalizedUrl} brand={mail.brand} />,
  });
};

export const sendResetPassword = async (
  ctx: GenericCtx<DataModel>,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  },
) => {
  const mail = getMailConfig();
  const normalizedUrl = normalizeMailUrl(url);
  await dispatchEmail({
    ctx,
    mail,
    to,
    subject: "Reset your password",
    type: "resetPassword",
    template: <ResetPasswordEmail url={normalizedUrl} brand={mail.brand} />,
  });
};

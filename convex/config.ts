import { query } from "./_generated/server";
import {
  readAppleConfigFromEnv,
  readAuthFeatureConfigFromEnv,
  readGithubConfigFromEnv,
  readGoogleConfigFromEnv,
  readMailConfigFromEnv,
} from "../shared/config";

export const publicConfig = query({
  args: {},
  handler: async () => {
    const githubConfig = readGithubConfigFromEnv(
      process.env as Record<string, string | undefined>,
    );
    const googleConfig = readGoogleConfigFromEnv(
      process.env as Record<string, string | undefined>,
    );
    const appleConfig = readAppleConfigFromEnv(
      process.env as Record<string, string | undefined>,
    );
    const mailConfig = readMailConfigFromEnv(
      process.env as Record<string, string | undefined>,
    );
    const authFeatures = readAuthFeatureConfigFromEnv(
      process.env as Record<string, string | undefined>,
    );

    return {
      githubOAuth: githubConfig.enabled,
      githubErrors: githubConfig.errors,
      googleOAuth: googleConfig.enabled,
      googleErrors: googleConfig.errors,
      appleOAuth: appleConfig.enabled,
      appleErrors: appleConfig.errors,
      mailPreview: mailConfig.preview,
      mailErrors: mailConfig.errors,
      brand: mailConfig.brand,
      passphraseSignIn: authFeatures.passphraseSignIn,
      passphraseSignUp: authFeatures.passphraseSignUp,
      magicLinkSignIn: authFeatures.magicLinkSignIn,
      verificationCodeSignIn: authFeatures.verificationCodeSignIn,
    };
  },
});

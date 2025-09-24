import { Heading, Link, Text } from "@react-email/components";
import type { MailConfig } from "../../shared/config";
import { BaseEmail } from "./components/BaseEmail";
import { baseEmailStyles } from "./components/baseEmailStyles";

const styles = baseEmailStyles;

type BrandProps = { brand?: MailConfig["brand"] };

interface MagicLinkEmailProps extends BrandProps {
  url: string;
}

export default function MagicLinkEmail({ url, brand }: MagicLinkEmailProps) {
  return (
    <BaseEmail previewText="Sign in with this magic link" brand={brand}>
      <Heading style={styles.h1}>Sign in</Heading>
      <Link
        href={url}
        target="_blank"
        style={{
          ...styles.link,
          display: "block",
          marginBottom: "16px",
        }}
      >
        Click here to sign in with this magic link
      </Link>
      <Text
        style={{
          ...styles.text,
          color: "#ababab",
          marginTop: "14px",
          marginBottom: "16px",
        }}
      >
        If you didn't try to sign in, you can safely ignore this email.
      </Text>
    </BaseEmail>
  );
}

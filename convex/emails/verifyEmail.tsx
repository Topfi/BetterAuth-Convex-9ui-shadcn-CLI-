import { Heading, Link, Text } from "@react-email/components";
import type { MailConfig } from "../../shared/config";
import { BaseEmail } from "./components/BaseEmail";
import { baseEmailStyles } from "./components/baseEmailStyles";

const styles = baseEmailStyles;

type BrandProps = { brand?: MailConfig["brand"] };

interface VerifyEmailProps extends BrandProps {
  url: string;
}

export default function VerifyEmail({ url, brand }: VerifyEmailProps) {
  return (
    <BaseEmail previewText="Verify your email address" brand={brand}>
      <Heading style={styles.h1}>Verify your email</Heading>
      <Link
        href={url}
        target="_blank"
        style={{
          ...styles.link,
          display: "block",
          marginBottom: "16px",
        }}
      >
        Click here to verify your email address
      </Link>
      <Text
        style={{
          ...styles.text,
          color: "#ababab",
          marginTop: "14px",
          marginBottom: "16px",
        }}
      >
        If you didn't create an account, you can safely ignore this email.
      </Text>
    </BaseEmail>
  );
}

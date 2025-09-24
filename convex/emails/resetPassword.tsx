import { Heading, Link, Text } from "@react-email/components";
import type { MailConfig } from "../../shared/config";
import { BaseEmail } from "./components/BaseEmail";
import { baseEmailStyles } from "./components/baseEmailStyles";

const styles = baseEmailStyles;

type BrandProps = { brand?: MailConfig["brand"] };

interface ResetPasswordEmailProps extends BrandProps {
  url: string;
}

export default function ResetPasswordEmail({
  url,
  brand,
}: ResetPasswordEmailProps) {
  return (
    <BaseEmail previewText="Reset your password" brand={brand}>
      <Heading style={styles.h1}>Reset Your Password</Heading>
      <Link
        href={url}
        target="_blank"
        style={{
          ...styles.link,
          display: "block",
          marginBottom: "16px",
        }}
      >
        Click here to reset your password
      </Link>
      <Text
        style={{
          ...styles.text,
          color: "#ababab",
          marginTop: "14px",
          marginBottom: "16px",
        }}
      >
        If you didn't request a password reset, you can safely ignore this
        email.
      </Text>
    </BaseEmail>
  );
}

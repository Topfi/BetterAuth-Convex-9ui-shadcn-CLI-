import { Heading, Text } from "@react-email/components";
import type { MailConfig } from "../../shared/config";
import { BaseEmail } from "./components/BaseEmail";
import { baseEmailStyles } from "./components/baseEmailStyles";

const styles = baseEmailStyles;

type BrandProps = { brand?: MailConfig["brand"] };

interface VerifyOTPProps extends BrandProps {
  code: string;
}

export default function VerifyOTP({ code, brand }: VerifyOTPProps) {
  return (
    <BaseEmail previewText="Your verification code" brand={brand}>
      <Heading style={styles.h1}>Verify your email</Heading>
      <Text style={styles.text}>
        Enter this verification code to verify your email address:
      </Text>
      <code style={styles.code}>{code}</code>
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

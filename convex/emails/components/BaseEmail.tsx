import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Text,
  Img,
  Preview,
} from "@react-email/components";
import { Fragment, type ReactNode } from "react";
import type { MailConfig } from "../../../shared/config";
import { baseEmailStyles } from "./baseEmailStyles";

type BrandInfo = MailConfig["brand"];

export interface BaseEmailProps {
  children: ReactNode;
  previewText: string;
  footerLinks?: Array<{ text: string; href: string }>;
  footerText?: string;
  brand?: BrandInfo;
}

const styles = baseEmailStyles;

export function BaseEmail({
  children,
  previewText,
  footerLinks = [],
  footerText,
  brand,
}: BaseEmailProps) {
  const brandName = brand?.name?.trim() || undefined;
  const brandTagline = brand?.tagline?.trim() || undefined;
  const brandLogoUrl = brand?.logoUrl;

  const footerPieces: string[] = [];
  if (brandName) {
    footerPieces.push(brandName);
  }
  if (brandTagline) {
    footerPieces.push(brandTagline);
  }

  let footerSummary = footerText;
  if (!footerSummary) {
    if (footerPieces.length === 0) {
      footerSummary = "Thanks for using our app.";
    } else if (footerPieces.length === 2) {
      footerSummary = `${footerPieces[0]}, ${footerPieces[1]}`;
    } else {
      footerSummary = footerPieces[0];
    }
  }

  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Preview>{previewText}</Preview>
        <Container style={styles.container}>
          {children}

          {brandLogoUrl && (
            <Img
              src={brandLogoUrl}
              width="32"
              height="32"
              alt={`${brandName ?? "Brand"} Logo`}
            />
          )}

          <Text style={styles.footer}>
            {footerLinks.map((link, i) => (
              <Fragment key={link.href}>
                <Link
                  href={link.href}
                  target="_blank"
                  style={{ ...styles.link, color: "#898989" }}
                >
                  {link.text}
                </Link>
                {i < footerLinks.length - 1 && " • "}
              </Fragment>
            ))}
            {footerLinks.length > 0 && <br />}
            {footerSummary}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

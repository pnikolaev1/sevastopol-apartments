import { LegalPage, legalMetadata } from "../_LegalPage";

export const generateMetadata = legalMetadata("privacy");

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LegalPage locale={locale} page="privacy" />;
}

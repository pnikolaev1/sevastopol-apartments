import { LegalPage, legalMetadata } from "../_LegalPage";

export const generateMetadata = legalMetadata("terms");

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LegalPage locale={locale} page="terms" />;
}

import { LegalPage, legalMetadata } from "../_LegalPage";

export const generateMetadata = legalMetadata("cookies");

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LegalPage locale={locale} page="cookies" />;
}

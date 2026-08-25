import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { Toaster } from "./component/toast";
import Chatbot from "./component/chatbot";
import { I18nProvider, WebsiteLanguageSelector } from "./i18n/client";
import { getServerI18n } from "./i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerI18n();
  return locale === "fr"
    ? { title: "Plateforme EasyAD", description: "Plateforme EasyAD — marché géospatial de publicité extérieure." }
    : { title: "EasyAD Platform", description: "EasyAD Platform — geospatial out-of-home advertising marketplace." };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getServerI18n();
  return (
    <html lang={locale}>
      <body><I18nProvider initialLocale={locale}><WebsiteLanguageSelector />{children}<Chatbot /><Toaster /></I18nProvider></body>
    </html>
  );
}

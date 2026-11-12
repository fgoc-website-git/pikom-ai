import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Header, Footer } from "@/components/Shell";
import { ConfirmHost, UndoBar } from "@/components/ui";

export const metadata: Metadata = {
  title: { default: "AI Xchange Malaysia — a PIKOM chapter", template: "%s | AI Xchange Malaysia" },
  description: "The information and networking platform for PIKOM members working in AI: verified member directory, opportunities, jobs, events, insights and policy.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pikom-ai.vercel.app"),
  openGraph: { type: "website", locale: "en_MY", siteName: "AI Xchange Malaysia", title: "AI Xchange Malaysia — a PIKOM chapter" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <ConfirmHost />
          <UndoBar />
        </StoreProvider>
      </body>
    </html>
  );
}

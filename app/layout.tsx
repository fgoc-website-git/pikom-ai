import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PIKOM AI Chapter — Malaysia AI Industry Portal",
    template: "%s | PIKOM AI Chapter",
  },
  description: "Malaysia's verified AI industry, connected in one place. 157 member organisations across 9 categories.",
  keywords: ["Malaysia AI","PIKOM","AI industry Malaysia","AI companies Malaysia","AI ecosystem Malaysia"],
  authors: [{ name: "PIKOM AI Chapter", url: "https://pikom.org.my" }],
  creator: "PIKOM — Persatuan Industri Komputer dan Multimedia Malaysia",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ai.pikom.org.my"),
  openGraph: {
    type: "website",
    locale: "en_MY",
    siteName: "PIKOM AI Chapter",
    title: "PIKOM AI Chapter — Malaysia AI Industry Portal",
    description: "157 verified AI organisations across 9 categories. The authoritative source for Malaysia's AI ecosystem.",
  },
  twitter: { card: "summary_large_image", title: "PIKOM AI Chapter — Malaysia AI Industry Portal" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

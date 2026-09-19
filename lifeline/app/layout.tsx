import type { Metadata } from "next";
import "./globals.css";
import JudgeEvaluationDrawer from "@/components/JudgeEvaluationDrawer";
import { LanguageProvider } from "@/lib/languageContext";

export const metadata: Metadata = {
  title: "LifeLine — Real-Time Blood Demand Matching",
  description:
    "Connecting donors, hospitals, and blood banks in real time so compatible blood is found in seconds, not hours.",
  openGraph: {
    title: "LifeLine — Real-Time Blood Demand Matching",
    description:
      "A scored matching engine that ranks donors and blood-bank stock by compatibility, proximity, urgency, and expiry — the moment a request is raised.",
    type: "website",
    siteName: "LifeLine",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased font-body bg-clay text-ink relative">
        <LanguageProvider>
          <JudgeEvaluationDrawer />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

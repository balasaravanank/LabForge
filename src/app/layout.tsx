import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

export const metadata: Metadata = {
  title: "LabForge",
  description:
    "LabForge: Generate professional lab record documents with QR codes and download as PDF or DOCX.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={beVietnamPro.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

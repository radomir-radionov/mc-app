import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { ResourcesAutoRefresh } from "@/components/dev/ResourcesAutoRefresh";
import { ThemeBootScript } from "@/components/nav/ThemeBootScript";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
    >
      <head>
        <ThemeBootScript />
      </head>
      <body className="h-full overflow-hidden bg-background font-sans text-foreground">
        <ResourcesAutoRefresh />
        {children}
        <Analytics />
      </body>
    </html>
  );
}

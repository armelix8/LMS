import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "UR UniPod — Innovation & Learning Community",
    template: "%s · UR UniPod",
  },
  description:
    "UR UniPod is the University of Rwanda's innovation community platform — programs, courses, makerspaces, and people turning ideas into prototypes.",
  applicationName: "UR UniPod",
  authors: [{ name: "University of Rwanda", url: "https://unipod.ur.ac.rw" }],
  keywords: [
    "UR UniPod",
    "University of Rwanda",
    "innovation",
    "makerspace",
    "labs",
    "courses",
    "programs",
    "prototyping",
  ],
  openGraph: {
    title: "UR UniPod — Innovation & Learning Community",
    description:
      "Programs, courses, labs and a community for innovators at the University of Rwanda.",
    siteName: "UR UniPod",
    locale: "en_RW",
    type: "website",
    images: [{ url: "/brand/unipod-logo.png", width: 592, height: 155 }],
  },
  twitter: {
    card: "summary",
    title: "UR UniPod",
    description:
      "Innovation & learning community at the University of Rwanda.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/brand/unipod-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Providers>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}

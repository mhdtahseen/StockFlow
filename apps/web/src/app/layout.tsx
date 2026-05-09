import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const BASE_URL = "https://finventree.in";
const TITLE = "Finventree — Paperless Inventory & Billing for Smartphone Dealers in India";
const DESCRIPTION =
  "Finventree is India's paperless platform for the smartphone trade. Manage inventory, GST billing, IMEI tracking, and business intelligence — 100% digital for smartphone resellers, retailers, wholesalers, and dealers.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  applicationName: "Finventree",
  title: {
    default: TITLE,
    template: "%s | Finventree",
  },
  description: DESCRIPTION,
  keywords: [
    "smartphone inventory management India",
    "mobile phone dealer software",
    "IMEI tracking software India",
    "GST billing software mobile",
    "smartphone wholesaler software",
    "mobile reseller inventory app",
    "phone dealer management system",
    "mobile shop billing software India",
    "paperless billing India",
    "Finventree",
    "smartphone retailer software",
    "second hand mobile management",
    "phone stock management",
    "digital inventory dealer",
  ],
  authors: [{ name: "Finventree", url: BASE_URL }],
  creator: "Finventree",
  publisher: "Finventree",
  category: "Business Software",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Finventree",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_IN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Finventree — Paperless Inventory & Billing for Smartphone Dealers in India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@finventree",
    creator: "@finventree",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  verification: {
    // Add your Google Search Console verification token here
    // google: "YOUR_GOOGLE_VERIFICATION_TOKEN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Skip to content for accessibility and SEO crawlability */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-slate-900 focus:rounded-lg focus:font-semibold"
          >
            Skip to main content
          </a>
          <div className="mesh-gradient" aria-hidden="true" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

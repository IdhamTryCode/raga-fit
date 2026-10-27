import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Raga Fit",
  description: "Catat latihanmu, lihat progresmu.",
  applicationName: "Raga Fit",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Raga Fit",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: ["/icon-192.png", "/icon-512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f1115",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col bg-surface text-ink">{children}</body>
    </html>
  );
}

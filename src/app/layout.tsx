import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: [
    { path: "./fonts/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Inter-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Inter-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Inter-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-inter",
});

const isProduction = process.env.NODE_ENV === "production";

export const metadata: Metadata = {
  title: isProduction ? "JASTIPin CMS" : "JASTIPin CMS Staging",
  description: "Sistem informasi operasional internal JASTIPin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}

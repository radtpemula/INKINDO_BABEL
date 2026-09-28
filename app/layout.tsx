import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INKINDO BABEL - Ikatan Nasional Konsultan Indonesia Provinsi Kepulauan Bangka Belitung",
  description: "Website resmi Ikatan Nasional Konsultan Indonesia (INKINDO) Provinsi Kepulauan Bangka Belitung",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-white text-[#1F2933] antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Dana Upacara Desa Adat",
  description:
    "Desentralisasi pengelolaan dana upacara adat dengan transparansi blockchain.",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <body className="font-sans text-foreground bg-background min-h-screen selection:bg-primary/30">
        <Toaster position="top-center" richColors theme="dark" />
        {/* Ambient background applied automatically to all pages */}
        <div className="bg-ambient pointer-events-none"></div>
        {children}
      </body>
    </html>
  );
}

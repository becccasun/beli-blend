import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import PhoneShell from "@/components/PhoneShell";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Beli · feature proposal",
  description: "Prototype of three proposed Beli features",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="h-full">
        <Suspense fallback={null}>
          <PhoneShell>{children}</PhoneShell>
        </Suspense>
      </body>
    </html>
  );
}

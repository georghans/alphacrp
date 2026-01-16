import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sellpy Gallery",
  description: "Automated Sellpy search and matching"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

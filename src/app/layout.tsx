import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Auth Basic", template: "%s · Auth Basic" },
  description: "A simple, secure place to get started.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

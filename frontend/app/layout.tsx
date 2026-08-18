import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "./app-shell";
import { LocalSyncBridge } from "./local-sync-bridge";
import { ProgressProvider } from "./progress-provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Leet Progress — Company-wise LeetCode prep",
  description: "Local-first company intelligence, progress, plans, and analytics for LeetCode preparation.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ProgressProvider>
          <LocalSyncBridge />
          <AppShell>{children}</AppShell>
        </ProgressProvider>
      </body>
    </html>
  );
}

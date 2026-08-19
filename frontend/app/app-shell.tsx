"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { useLocalSync } from "./local-sync-bridge";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/explore", label: "Explore" },
  { href: "/companies", label: "Companies" },
  { href: "/topics", label: "Topics" },
  { href: "/plans", label: "Plans" },
  { href: "/insights", label: "Insights" },
] as const;

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks() {
  const pathname = usePathname();
  return navItems.map((item) => {
    const isActive = active(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#6878e8] ${
          isActive ? "bg-[#171717] text-white" : "text-black/55 hover:bg-black/[.05] hover:text-black"
        }`}
      >
        {item.label}
      </Link>
    );
  });
}

function NavFallback() {
  return navItems.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold text-black/55 transition focus:outline-none focus:ring-2 focus:ring-[#6878e8]"
    >
      {item.label}
    </Link>
  ));
}

function SyncStatus() {
  const { diagnostics, syncNow } = useLocalSync();
  const label = diagnostics.state === "connected"
    ? "Extension linked"
    : diagnostics.state === "checking"
      ? "Checking extension"
      : diagnostics.state === "unavailable"
        ? "Local only"
        : "Sync retry";

  return (
    <button
      type="button"
      onClick={syncNow}
      aria-label={`Local extension sync: ${label}. Sync now`}
      title={diagnostics.lastError ? `Local sync: ${diagnostics.lastError}` : "Sync website and extension in this browser"}
      className="hidden shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] font-semibold text-black/55 transition hover:border-black/20 hover:text-black focus:outline-none focus:ring-2 focus:ring-[#6878e8] md:flex"
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${diagnostics.state === "connected" ? "bg-emerald-500" : diagnostics.state === "error" ? "bg-amber-500" : "bg-black/25"}`} />
      {label}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f7f7f5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6878e8]">
            <span className="grid size-9 place-items-center rounded-xl bg-[#171717] text-sm font-bold text-white">LP</span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold">Leet Progress</span>
              <span className="block text-[11px] text-black/45">Local-first interview intelligence</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1">
            <Suspense fallback={<NavFallback />}>
              <NavLinks />
            </Suspense>
          </nav>

          <SyncStatus />
          <Link href="/privacy" className="hidden shrink-0 rounded-full px-2 py-2 text-[11px] font-semibold text-black/45 hover:text-black focus:outline-none focus:ring-2 focus:ring-[#6878e8] lg:block">Privacy</Link>
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}

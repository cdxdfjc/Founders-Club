"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BackToFeed() {
  const pathname = usePathname();
  if (pathname === "/feed") return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return null;

  return (
    <Link
      href="/feed"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink transition mb-6"
    >
      <span className="text-base leading-none">←</span>
      Torna alla home
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/feed", emoji: "🏠", label: "Home" },
  { href: "/progetti", emoji: "💡", label: "Progetti" },
  { href: "/aiuto", emoji: "🙋", label: "Aiuto" },
  { href: "/eventi", emoji: "☕", label: "Meetup" },
  { href: "/bar", emoji: "🍺", label: "Bar" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors"
            style={{
              color: active ? "var(--wisteria)" : "var(--ink-50)",
            }}
          >
            <span className="text-lg leading-none">{item.emoji}</span>
            <span
              className="text-[10px] font-semibold leading-none"
              style={{ fontFamily: "var(--font-jakarta), ui-sans-serif, system-ui" }}
            >
              {item.label}
            </span>
            {active && (
              <span
                className="absolute bottom-1 w-5 h-0.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--sky-aqua), var(--wisteria), var(--plum))",
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

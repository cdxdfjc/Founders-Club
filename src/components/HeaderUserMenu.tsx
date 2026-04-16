"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { logout } from "@/lib/actions/auth";

type Props = {
  firstName: string;
  username: string;
  avatarUrl: string | null;
};

export function HeaderUserMenu({ firstName, username, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function computePos() {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({
        top: r.bottom + 8,
        right: window.innerWidth - r.right,
      });
    }
    computePos();

    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", computePos);
    window.addEventListener("scroll", computePos, true);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", computePos);
      window.removeEventListener("scroll", computePos, true);
    };
  }, [open]);

  const initial = firstName.charAt(0).toUpperCase();

  const menu = open && mounted
    ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed w-60 rounded-2xl p-1.5"
          style={{
            top: pos.top,
            right: pos.right,
            zIndex: 9999,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow:
              "0 20px 60px -15px rgba(60,70,120,0.25), 0 8px 20px -8px rgba(60,70,120,0.15)",
            transformOrigin: "top right",
          }}
        >
          <Link
            href={`/profilo/${username}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/80 transition text-sm whitespace-nowrap"
            role="menuitem"
          >
            <span className="text-base">👤</span>
            <span className="font-semibold">Il mio profilo</span>
          </Link>
          <Link
            href="/impostazioni"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/80 transition text-sm whitespace-nowrap"
            role="menuitem"
          >
            <span className="text-base">✏️</span>
            <span className="font-semibold">Modifica profilo</span>
          </Link>
          <div className="h-px bg-ink/10 my-1.5" />
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/80 transition text-sm text-ink/70 whitespace-nowrap"
              role="menuitem"
            >
              <span className="text-base">⎋</span>
              <span className="font-semibold">Esci</span>
            </button>
          </form>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Profilo e impostazioni"
        className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full bg-white/60 hover:bg-white transition border border-ink/5 shadow-sm"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
            }}
          >
            {initial}
          </span>
        )}
        <span className="text-sm font-semibold hidden sm:inline">Profilo</span>
        <span
          className="text-ink/50 text-[10px] transition-transform hidden sm:inline"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>
      {menu}
    </>
  );
}

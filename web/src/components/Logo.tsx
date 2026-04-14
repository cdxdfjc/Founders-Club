import Image from "next/image";
import Link from "next/link";

export function Logo({
  href = "/",
  size = "md",
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? 28 : size === "lg" ? 44 : 34;
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";
  return (
    <Link href={href} className="inline-flex items-center gap-2 group">
      <span
        className="relative inline-flex items-center justify-center rounded-full bg-white/60 backdrop-blur border border-white/70 shadow-sm transition-transform group-hover:rotate-[-6deg]"
        style={{ width: dim + 12, height: dim + 12 }}
      >
        <Image
          src="/unicorn-v2.png"
          alt=""
          width={dim}
          height={dim}
          className="object-contain"
          priority
        />
      </span>
      <span className={`font-display font-semibold tracking-tight ${text}`}>
        Founders<span className="gradient-text">Club</span>
      </span>
    </Link>
  );
}

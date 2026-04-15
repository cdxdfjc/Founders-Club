"use client";

import { ReactNode, CSSProperties } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  children: ReactNode;
  pendingLabel?: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
};

export function SubmitButton({
  children,
  pendingLabel,
  className,
  style,
  disabled,
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={className}
      style={style}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          {pendingLabel ?? "Pubblico…"}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
    />
  );
}

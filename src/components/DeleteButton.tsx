"use client";

import { ReactNode } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
  hiddenName: string;
  hiddenValue: string;
  confirmText: string;
  className?: string;
  children: ReactNode;
};

export function DeleteButton({
  action,
  hiddenName,
  hiddenValue,
  confirmText,
  className,
  children,
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name={hiddenName} value={hiddenValue} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

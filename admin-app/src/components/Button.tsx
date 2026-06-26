import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
};

export function Button({ children, className = "", variant = "primary", ...buttonProps }: ButtonProps) {
  return (
    <button className={`ysm-button is-${variant} ${className}`.trim()} {...buttonProps}>
      {children}
    </button>
  );
}

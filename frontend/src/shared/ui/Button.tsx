import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-700/20 hover:from-brand-500 hover:to-brand-800 active:to-brand-900 focus-visible:ring-brand-300",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm shadow-slate-900/[0.03] focus-visible:ring-slate-300",
  ghost:
    "text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-300",
  danger:
    "bg-rose-600 text-white shadow-sm shadow-rose-700/20 hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-300"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 gap-1.5 px-3 text-xs",
  md: "min-h-11 gap-2 px-4 text-sm"
};

const baseStyles =
  "inline-flex cursor-pointer items-center justify-center rounded-xl font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60";

export const buttonClasses = (
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string
): string => cn(baseStyles, variantStyles[variant], sizeStyles[size], extra);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  )
);

Button.displayName = "Button";

import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({ className, variant = "primary", size = "md", loading, children, ...rest }: Props) {
  const sizeClass =
    size === "sm" ? "px-4 py-2 text-xs" : size === "lg" ? "px-8 py-4 text-base" : "px-6 py-3 text-sm";
  
  const variantClass =
    variant === "primary"
      ? "cyber-btn-primary"
      : variant === "outline"
      ? "cyber-btn-secondary"
      : variant === "secondary"
      ? "cyber-btn border-purple-500/50"
      : "cyber-btn border-white/20 bg-transparent";
  
  return (
    <button
      className={clsx(
        sizeClass,
        variantClass,
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none",
        className
      )}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span>PROCESSING...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}



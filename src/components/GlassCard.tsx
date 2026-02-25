import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function GlassCard({
  children,
  className,
  onClick,
  hoverable = true,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card p-6",
        hoverable && "cursor-pointer",
        !hoverable && "[&]:hover:bg-[rgba(19,17,28,0.7)] [&]:hover:border-[rgba(30,26,46,0.8)] [&]:hover:shadow-none",
        className
      )}
    >
      {children}
    </div>
  );
}

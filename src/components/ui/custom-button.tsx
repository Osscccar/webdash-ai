import type React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

interface CustomButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export function PrimaryButton({
  className,
  children,
  ...props
}: CustomButtonProps) {
  return (
    <Button
      className={cn(
        "relative bg-gradient-to-r from-[#FF7300] to-[#FF8826] text-white rounded-[16px] transition-all",
        "shadow-[0_0_11px_0_rgba(255,115,0,0.5),_0_0_1px_1px_rgba(255,255,255,0.15)]",
        "hover:shadow-[0_0_15px_0_rgba(255,115,0,0.7),_0_0_2px_1px_rgba(255,255,255,0.25)]",
        "font-medium text-base",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

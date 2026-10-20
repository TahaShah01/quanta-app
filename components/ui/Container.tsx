import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow" | "full";
}

export function Container({ children, className = "", size = "full" }: ContainerProps) {
  const widthClass =
    size === "narrow"
      ? "max-w-4xl mx-auto"
      : "w-full max-w-[3840px] mx-auto";

  return (
    <div
      className={`${widthClass} px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24 3xl:px-32 ${className}`}
    >
      {children}
    </div>
  );
}

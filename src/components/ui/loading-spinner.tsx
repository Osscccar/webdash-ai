import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export function LoadingSpinner({
  size = "md",
  message = "Loading...",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-t-2 border-b-2 border-[#f58327]`}
      ></div>
      {message && <p className="text-gray-600 font-normal">{message}</p>}
    </div>
  );
}

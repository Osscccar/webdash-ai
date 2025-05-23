// src/app/pricing/client-component.tsx

"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface ClientComponentProps {
  onUpgradeChange: (value: boolean) => void;
}

export default function ClientComponent({
  onUpgradeChange,
}: ClientComponentProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract and pass the upgrade parameter to the parent component
    const isUpgrade = searchParams.get("upgrade") === "true";
    onUpgradeChange(isUpgrade);
  }, [searchParams, onUpgradeChange]);

  // This component doesn't render anything visible
  return null;
}
